#!/usr/bin/env python3
"""Generate the responsive image set used by the site.

The originals are kept in ``image-originals-backup/`` at the repository root,
outside both served trees. This script reads from that backup (copying a file
there on first run), writes the optimised files into ``frontend/public`` and
copies the same relative paths into ``backend/media`` so local Django media and
the production Angular build serve identical files.

Run from the repository root:

    backend/.venv/bin/python scripts/optimize_images.py
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "frontend" / "public"
MEDIA = ROOT / "backend" / "media"
BACKUP = ROOT / "image-originals-backup"

LANCZOS = Image.Resampling.LANCZOS


def master(relative_path: str) -> Image.Image:
    """Open the untouched master, backing it up first if this is a first run."""
    public_path = PUBLIC / relative_path
    backup_path = BACKUP / relative_path
    if not backup_path.exists():
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(public_path, backup_path)
    image = Image.open(backup_path)
    image.load()
    return ImageOps.exif_transpose(image)


def resized(image: Image.Image, width: int) -> Image.Image:
    """Resize to a width, never upscaling, preserving aspect ratio."""
    if image.width <= width:
        return image.copy()
    height = round(image.height * width / image.width)
    return image.resize((width, height), LANCZOS)


def publish(relative_path: str, image: Image.Image, **save_options) -> int:
    """Write one file to the public tree and mirror it into backend media."""
    public_path = PUBLIC / relative_path
    public_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(public_path, **save_options)

    media_path = MEDIA / relative_path
    media_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(public_path, media_path)
    return public_path.stat().st_size


def variants(
    relative_path: str,
    widths: tuple[int, ...],
    *,
    jpeg_quality: int,
    webp_quality: int,
    avif_quality: int,
) -> list[tuple[str, int]]:
    """Write JPEG, WebP and AVIF candidates, then replace the fallback master."""
    image = master(relative_path)
    source = Path(relative_path)
    stem = source.with_suffix("")
    written: list[tuple[str, int]] = []

    for width in widths:
        candidate = resized(image, width)

        jpeg_name = f"{stem}-{width}.jpg"
        written.append(
            (
                jpeg_name,
                publish(
                    jpeg_name,
                    candidate.convert("RGB"),
                    format="JPEG",
                    quality=jpeg_quality,
                    optimize=True,
                    progressive=True,
                    subsampling=1,
                ),
            )
        )

        webp_name = f"{stem}-{width}.webp"
        written.append(
            (
                webp_name,
                publish(webp_name, candidate, format="WEBP", quality=webp_quality, method=6),
            )
        )

        avif_name = f"{stem}-{width}.avif"
        try:
            written.append(
                (
                    avif_name,
                    publish(avif_name, candidate, format="AVIF", quality=avif_quality, speed=4),
                )
            )
        except Exception as error:  # Pillow without AVIF support, or an encoder failure.
            print(f"  skipped {avif_name}: {error}")

    # The path stored in the CMS stays the fallback, now resized and compressed.
    fallback = resized(image, max(widths))
    fallback_format = "JPEG" if source.suffix.lower() in {".jpg", ".jpeg"} else "PNG"
    written.append(
        (
            relative_path,
            publish(
                relative_path,
                fallback.convert("RGB") if fallback_format == "JPEG" else fallback,
                format=fallback_format,
                quality=jpeg_quality if fallback_format == "JPEG" else None,
                optimize=True,
                progressive=fallback_format == "JPEG",
                subsampling=1 if fallback_format == "JPEG" else None,
            ),
        )
    )

    return written


def logo(relative_path: str, width: int) -> list[tuple[str, int]]:
    """Write a same-name WebP and an optimised PNG fallback for a transparent logo."""
    image = resized(master(relative_path), width)
    source = Path(relative_path)
    webp_name = str(source.with_suffix(".webp"))
    written = [
        (
            webp_name,
            publish(
                webp_name,
                image,
                format="WEBP",
                quality=92,
                method=6,
                alpha_quality=100,
            ),
        )
    ]

    # Preserve transparency with a palette when that is smaller than truecolour.
    png_name = str(source)
    optimised = image.copy()
    quantised = image.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    if quantised.size == image.size:
        optimised = quantised
    written.append(
        (
            png_name,
            publish(png_name, optimised, format="PNG", optimize=True),
        )
    )
    return written


def main() -> None:
    jobs = [
        (
            "assets/images/hero-addis.jpg",
            (640, 1024, 1600, 2560),
            {"jpeg_quality": 78, "webp_quality": 75, "avif_quality": 50},
        ),
        (
            "assets/images/kairos-alliance.jpg",
            (640, 1024, 1600, 1920),
            {"jpeg_quality": 78, "webp_quality": 78, "avif_quality": 52},
        ),
        (
            "assets/images/industries-realestate.jpg",
            (480, 768, 1200, 1600),
            {"jpeg_quality": 80, "webp_quality": 80, "avif_quality": 54},
        ),
        (
            "assets/images/industries-manufacturing.jpg",
            (480, 768, 1200, 1600),
            {"jpeg_quality": 80, "webp_quality": 80, "avif_quality": 54},
        ),
        (
            "assets/images/industries-mining.jpg",
            (480, 768, 1200, 1600),
            {"jpeg_quality": 80, "webp_quality": 80, "avif_quality": 54},
        ),
        (
            "assets/images/Abel.jpg",
            (460, 920),
            {"jpeg_quality": 82, "webp_quality": 85, "avif_quality": 62},
        ),
        (
            "assets/images/habtamu.jpg",
            (460, 920),
            {"jpeg_quality": 82, "webp_quality": 85, "avif_quality": 62},
        ),
        (
            "assets/images/Kalkidan H.jpg",
            (460, 920),
            {"jpeg_quality": 82, "webp_quality": 85, "avif_quality": 62},
        ),
    ]

    for relative_path, widths, quality in jobs:
        print(relative_path)
        for name, size in variants(relative_path, widths, **quality):
            print(f"  {name} {size:,} B")

    print("dinq_gold_premium.png")
    for name, size in logo("dinq_gold_premium.png", 450):
        print(f"  {name} {size:,} B")

    print("KAIROS_Logo_White_transparent.png")
    for name, size in logo("KAIROS_Logo_White_transparent.png", 512):
        print(f"  {name} {size:,} B")


if __name__ == "__main__":
    main()
