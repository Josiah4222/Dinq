# Deploying Dinq to a public server

Target: Ubuntu or Debian, serving `dinqadvisory.com` and `www.dinqadvisory.com`
(both already resolve to the server) over HTTP and HTTPS, with the bare IP
redirecting to the canonical host.

This is written for a first deploy onto an empty server. It assumes you are
root or can `sudo`, and that ports 80 and 443 are free — check with
`ss -tlnp | grep -E ':80|:443'` before starting.

The shape of it:

```
nginx  ──┬── /                      static, the built Angular app
         ├── /static/               collected Django static
         ├── /media/                uploaded images
         └── /api/ /django-admin/   gunicorn → Django
```

The staff panel (`/admin/...`) and the sign-in page (`/login`) are part of the
Angular app, not proxied — a hard refresh of `/admin/contact` is answered by the
SPA fallback like any other deep link. The stock Django admin was moved out of
the way to `/django-admin/` so the panel keeps the address it was built on.

One origin, deliberately. The frontend calls the API with root-relative paths
and has no configurable base URL, and staff sign-in is a session cookie with
`SameSite=Lax`. Split the app and the API across hosts and the browser drops the
cookie on every API call, so sign-in fails while looking like a credentials
problem.

---

## 0. Before you start: get the code into git

This is not optional and it is the step most likely to be skipped.

```bash
git -C /path/to/Dinq ls-files backend | wc -l
```

If that prints `0`, the backend is untracked. So is most of the current
frontend — the repo has one commit from before the CMS rewrite. A clone of the
GitHub remote right now contains **no Django backend and none of the live site**.

Either commit and push from your machine first:

```bash
cd /path/to/Dinq
git add -A
git commit -m "Add Django backend and CMS-driven frontend"
git push origin main
```

Or, if you would rather copy the tree directly, skip the clone step below and
`scp` the working directory instead. Check `.gitignore` before you do: it
correctly excludes `db.sqlite3`, `backend/media/`, `frontend/node_modules/`,
`frontend/dist/`, and `__pycache__/`, so you will want to bring the database and
media across by hand.

---

## 1. System packages

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx certbot \
                    python3-certbot-nginx rsync
```

A dedicated unprivileged user owns the app. gunicorn should never run as root.

```bash
sudo useradd --system --create-home --home-dir /home/dinq --shell /usr/sbin/nologin dinq
```

---

## 2. Get the code

```bash
sudo mkdir -p /srv/dinq
sudo chown dinq:dinq /srv/dinq
sudo -u dinq git clone https://github.com/Josiah4222/Dinq.git /srv/dinq/repo
```

Or copy an existing working tree, which is what you want if the code is not
pushed yet:

```bash
rsync -az --exclude node_modules --exclude .git --exclude dist \
      --exclude db.sqlite3 --exclude media --exclude __pycache__ \
      ./ user@server:/tmp/dinq-upload/
sudo rsync -az /tmp/dinq-upload/ /srv/dinq/repo/
sudo chown -R dinq:dinq /srv/dinq
```

You will run the rest of these commands as `dinq` unless noted:

```bash
sudo -u dinq -i
cd /srv/dinq/repo/backend
```

---

## 3. Python environment

```bash
python3 -m venv /srv/dinq/venv
/srv/dinq/venv/bin/pip install --upgrade pip
/srv/dinq/venv/bin/pip install -r requirements.txt
/srv/dinq/venv/bin/pip install gunicorn
```

`gunicorn` is not in `requirements.txt` because it is a serving concern rather
than an application one. `whitenoise` is deliberately not installed: nginx
serves static files, and having Django do it as well would only add a second
place for them to disagree.

---

## 4. Environment file

```bash
sudo mkdir -p /etc/dinq
sudo install -m 600 /dev/null /etc/dinq/dinq.env
sudo nano /etc/dinq/dinq.env
```

Start from `deploy/dinq.env.example` in the repo, which documents every value.
The one that is not optional and must be generated fresh:

```bash
python -c "from django.core.management.utils import get_random_secret_key as k; print(k())"
```

`settings_prod.py` raises at startup if `DJANGO_SECRET_KEY` or
`DJANGO_ALLOWED_HOSTS` is missing. That is on purpose — a production process
that starts with a published secret key is worse than one that refuses to start.

### Contact-form email notifications

A new `/contact` submission emails `DJANGO_CONTACT_NOTIFICATION_EMAILS` through
the SMTP relay in the same env file (see `deploy/dinq.env.example`). The values
are optional: with `DJANGO_EMAIL_HOST` blank nothing is sent, and submissions
are still stored and listed in the staff panel. Sending is best-effort — a mail
failure is logged and never fails the visitor's form.

To use a Gmail/Google Workspace account as the sender, turn on 2-Step
Verification, create an App Password, and set:

```
DJANGO_EMAIL_HOST=smtp.gmail.com
DJANGO_EMAIL_PORT=587
DJANGO_EMAIL_HOST_USER=you@yourdomain.com
DJANGO_EMAIL_HOST_PASSWORD=the-16-character-app-password
DJANGO_DEFAULT_FROM_EMAIL=Dinq Advisory Group <you@yourdomain.com>
DJANGO_CONTACT_NOTIFICATION_EMAILS=eyosialex12@gmail.com
```

`DJANGO_DEFAULT_FROM_EMAIL` must be an address the relay is allowed to send as.
Restart the service after editing the file, then submit the contact form and
check the recipient's inbox (and spam).

---

## 5. Database and content

Fresh start, as chosen. The seed is idempotent, so this is safe to re-run.

```bash
cd /srv/dinq/repo/backend
export DJANGO_SETTINGS_MODULE=config.settings_prod
set -a; . /etc/dinq/dinq.env; set +a

/srv/dinq/venv/bin/python manage.py migrate
/srv/dinq/venv/bin/python manage.py seed_cms
```

`seed_cms` writes the shipped copy. Do **not** pass `--overwrite` on a server
that has been edited through the CMS — it replaces edited values with the
original text.

The built-in images are copied out of `frontend/public` and their paths
rewritten to `/media/...`; this is safe to re-run and needed for the portraits
and hero images to resolve:

```bash
/srv/dinq/venv/bin/python manage.py migrate_images
```

Create a staff login. There is no registration, and this has to be done on the
command line:

```bash
/srv/dinq/venv/bin/python manage.py createsuperuser
```

---

## 6. Frontend build

```bash
cd /srv/dinq/repo/frontend
npm ci
npm run build
```

The output lands in `dist/dinq/browser/` — note the extra `browser` level. The
modern Angular builder nests it, and the nginx config points at that exact path.

Builds fetch Google Fonts at build time, so this step needs outbound HTTPS. If
it fails with "Inlining of fonts failed", the network is the cause, not the code.

---

## 7. Static files

```bash
cd /srv/dinq/repo/backend
/srv/dinq/venv/bin/python manage.py collectstatic --noinput
```

`settings_prod.py` sets `STATIC_ROOT` and `STATICFILES_DIRS`; the base settings
set neither, which is why this command fails outright in development. It also
corrects `STATIC_URL` to `/static/` — the development value `'static/'` has no
leading slash and resolves relative to the current path.

---

## 8. gunicorn service

```bash
sudo cp /srv/dinq/repo/deploy/systemd/dinq.service /etc/systemd/system/dinq.service
sudo systemctl daemon-reload
sudo systemctl enable --now dinq
sudo systemctl status dinq
```

It binds `127.0.0.1:8000` — loopback only, so gunicorn is not reachable from the
internet even if the firewall is wrong. Check it locally:

```bash
curl -I http://127.0.0.1:8000/api/content/pages/home/version/
```

---

## 9. nginx

```bash
sudo cp /srv/dinq/repo/deploy/nginx/dinqadvisory.com.conf /etc/nginx/sites-available/dinqadvisory.com
sudo ln -s /etc/nginx/sites-available/dinqadvisory.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

The config expects these directories to exist:

```bash
sudo mkdir -p /var/www/certbot /srv/dinq/backend/media /srv/dinq/backend/staticfiles
sudo chown -R dinq:dinq /srv/dinq/backend
```

---

## 10. Certificate

HTTP is already up and redirecting, and the ACME challenge is served from
`/var/www/certbot` on both the http and https servers. Ask for both names — `www`
is a CNAME to the apex, so a single-name certificate would not cover
`dinqadvisory.com`:

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d dinqadvisory.com -d www.dinqadvisory.com
```

Now that a certificate exists and renewal is working, turn on HSTS — in
`/etc/dinq/dinq.env`:

```
DJANGO_HSTS_SECONDS=31536000
```

```bash
sudo systemctl restart dinq
```

Confirm renewal is set up:

```bash
sudo certbot renew --dry-run
```

**Read this before setting HSTS.** A browser that has cached the header will
refuse to fall back to plain http. If the certificate later fails to renew and
you do not fix it, the site is unreachable from those browsers until the header
is removed and the cache ages out. The `strict-transport-security` header in the
nginx config already does the same thing, so the two are belt and braces; if you
would rather not have two places, remove it from nginx and let Django own it.

---

## 11. Check it

```bash
curl -I https://www.dinqadvisory.com/
curl -I https://dinqadvisory.com/          # expect a 301 to www
curl -I http://2.25.106.23/               # expect a 301 to https www
curl -s https://www.dinqadvisory.com/api/content/pages/home/version/ | head -c 200
curl -I https://www.dinqadvisory.com/login/           # 301 → /login, the Angular sign-in
curl -I https://www.dinqadvisory.com/admin/contact    # 200, the staff panel (guards client-side)
curl -I https://www.dinqadvisory.com/django-admin/login/  # the stock admin
```

Then in a browser: load the site, sign in at `/login`, land on the staff panel
at `/admin/contact`, and submit the contact and quick-inquiry forms. Those
exercise the session cookie and the CSRF origin check, which are the two things
most likely to be wrong and the least obvious from a `curl`.

Also worth clicking: a deep link like `/industries/real-estate` on a hard
refresh. If that 404s, the SPA `try_files` fallback in the nginx config is not
taking effect.

---

## Redeploying after a code change

```bash
sudo -u dinq -i
cd /srv/dinq/repo && git pull

cd backend
/srv/dinq/venv/bin/pip install -r requirements.txt
set -a; . /etc/dinq/dinq.env; set +a
export DJANGO_SETTINGS_MODULE=config.settings_prod
/srv/dinq/venv/bin/python manage.py migrate
/srv/dinq/venv/bin/python manage.py collectstatic --noinput

cd ../frontend
npm ci && npm run build

sudo systemctl restart dinq
sudo nginx -t && sudo systemctl reload nginx
```

Check for a pending CMS snapshot change before committing; it fails when the
database and the checked-in snapshot disagree:

```bash
cd /srv/dinq/repo/backend
/srv/dinq/venv/bin/python manage.py dump_cms --check
```

---

## What is not covered

- **SQLite under concurrent load.** Fine for a marketing site. Each gunicorn
  worker holds its own connection, so writes serialise on the file lock; heavy
  concurrent form traffic is the point to move to PostgreSQL.
- **Backups.** `db.sqlite3` and `backend/media/` are gitignored on purpose —
  they are content, and losing them loses every uploaded image and every form
  submission. Back them up separately and on a schedule.
- **Automated deploys.** There is no CI in this repo. The steps above are manual
  and intended to be.
