# Deploying bitpopart.com to TransIP hosting

Every push to `main` builds the site and uploads `dist/` to the TransIP web hosting
(`.github/workflows/deploy-transip.yml`). Nothing happens until the secrets exist.

## One-time setup
1. TransIP control panel > Webhosting > your package > FTP. Create (or look up) an FTP user
   and note the host name. Check that the document root of bitpopart.com is `/www/`.
2. GitHub repo bitpopart/nostrpop > Settings > Secrets and variables > Actions. Add:
   - `TRANSIP_FTP_HOST`
   - `TRANSIP_FTP_USER`
   - `TRANSIP_FTP_PASS`
   - `TRANSIP_FTP_DIR` (only if the document root is not `/www/`)
3. Actions tab > "Deploy to TransIP hosting" > Run workflow. Test on the TransIP temporary
   address before touching DNS.
4. In the TransIP panel, make sure an SSL certificate is active for bitpopart.com and www.
5. Point DNS: the bitpopart.com A record to the TransIP hosting IP (replace the GitHub Pages
   records). Keep the old setup until the new one answers correctly.

## Check after the switch
- `https://bitpopart.com/art` opens directly and `curl -I` shows `200` (not 404).
- A new commit on main shows up on the site a few minutes later.
- Submit https://bitpopart.com/sitemap.xml in Google Search Console and request indexing
  for /b and /art.
