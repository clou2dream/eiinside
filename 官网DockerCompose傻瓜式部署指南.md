# EIINSIDE 官网 Docker Compose 傻瓜式部署指南

> 适用场景：本地是 Windows，服务器是 Linux，官网当前已经从纯静态页面升级为“静态页面 + 文章编辑写入服务”。  
> 本地项目目录：`D:\work\eiinside`  
> 推荐线上目录：`/opt/eiinside`  
> 推荐域名示例：`index.eiinside.com`

---

## 1. 先搞清楚现在部署的东西

现在官网不再只是静态文件，因为文章编辑器需要保存：

```text
content/articles.json
assets/articles/
```

所以线上至少需要两类能力：

```text
Nginx
  负责公网访问、静态文件、域名、HTTPS、基础认证

Node CMS 服务 local-server.js
  负责接收 PUT 请求，把文章 JSON 和文章图片写回服务器目录
```

推荐架构：

```text
浏览器
  -> 线上 Nginx
      -> 普通页面：直接读静态文件
      -> /admin/：加密码后访问编辑器
      -> PUT /content/articles.json：转发给 Node CMS 写入
      -> PUT /assets/articles/*：转发给 Node CMS 写入图片
```

重要提醒：

- 编辑器页面里的 `admin / eiinside123qwe!@#` 只是前端校验，不是真正安全。
- 线上必须在 Nginx 层给 `/admin/` 和写入接口加 Basic Auth。
- 不要把 `local-server.js` 直接暴露到公网端口。

---

## 2. 线上目录规划

登录 Linux 服务器：

```bash
ssh root@<服务器公网IP>
```

创建目录：

```bash
mkdir -p /opt/eiinside/site
mkdir -p /opt/eiinside/deploy
mkdir -p /opt/eiinside/backup
mkdir -p /opt/eiinside/releases
```

目录用途：

```text
/opt/eiinside/site      当前线上官网文件
/opt/eiinside/deploy    compose.yaml、nginx 配置、认证文件
/opt/eiinside/backup    每次更新前的备份
/opt/eiinside/releases  每次上传的新版本
```

---

## 3. 本地 Windows 打包官网

打开 Windows PowerShell：

```powershell
cd D:\work\eiinside
```

生成版本号：

```powershell
$REL=Get-Date -Format "yyyyMMdd-HHmmss"
$SERVER="root@<服务器公网IP>"
Write-Host "本次发布版本号：$REL"
```

打包

```powershell
Compress-Archive `
  -Path .\admin,.\assets,.\content,.\about.html,.\article.html,.\articles.html,.\index.html,.\local-server.js,.\script.js,.\styles.css `
  -DestinationPath ".\eiinside-$REL.zip" `
  -Force
```

上传到服务器：

```powershell
ssh $SERVER "mkdir -p /opt/eiinside/releases/$REL"
scp ".\eiinside-$REL.zip" "${SERVER}:/opt/eiinside/releases/$REL/"
Write-Host "已上传版本：$REL"
```

如果 PowerShell 窗口关了，重新设置：

```powershell
$SERVER="root@<服务器公网IP>"
$REL="刚才输出的版本号"
```

---

## 4. 服务器解压并准备站点文件

登录服务器：

```bash
ssh root@<服务器公网IP>
```

设置版本号：

```bash
export REL=刚才上传的版本号
cd /opt/eiinside
```

解压到 release 目录：

```bash
cd /opt/eiinside/releases/$REL
unzip -o eiinside-$REL.zip -d site
```

首次部署时复制到线上目录：

```bash
rm -rf /opt/eiinside/site/*
cp -a /opt/eiinside/releases/$REL/site/. /opt/eiinside/site/
```

确认关键文件存在：

```bash
ls -lh /opt/eiinside/site/index.html
ls -lh /opt/eiinside/site/admin/articles-editor.html
ls -lh /opt/eiinside/site/local-server.js
ls -lh /opt/eiinside/site/content/articles.json
```

---

## 5. Docker Compose 部署 Node CMS 服务

如果你已经有一个对外 Nginx 容器，推荐只给官网新增 CMS 服务。

进入部署目录：

```bash
cd /opt/eiinside/deploy
```

创建 `compose.yaml`：

```bash
nano compose.yaml
```

写入：

```yaml
services:
  eiinside-cms:
    image: node:20-alpine
    container_name: eiinside-cms
    working_dir: /app
    command: node local-server.js
    environment:
      PORT: 5173
    volumes:
      - /opt/eiinside/site:/app
    expose:
      - "5173"
    restart: unless-stopped
```

启动：

```bash
docker compose up -d
docker compose ps
docker compose logs -f --tail=100 eiinside-cms
```

看到下面内容说明 CMS 服务启动成功：

```text
EIINSIDE local writable server running at http://127.0.0.1:5173
Writable targets: /content/articles.json, /assets/articles/*
```

按 `Ctrl + C` 退出日志。

---

## 6. 如果已有公网 Nginx 容器，接入现有 Nginx

### 6.1 让 Nginx 容器能访问 eiinside-cms

如果现有 Nginx 和 `eiinside-cms` 不在同一个 Docker 网络，需要创建一个共享网络。

查看当前容器：

```bash
docker ps
```

创建网络：

```bash
docker network create web-gateway
```

把现有 Nginx 容器接入网络，假设容器名叫 `nginx`：

```bash
docker network connect web-gateway nginx
docker network connect web-gateway eiinside-cms
```

如果提示已经在网络里，可以忽略。

### 6.2 挂载官网静态目录到现有 Nginx

如果你的现有 Nginx 是 Docker Compose 管理，需要在它的 compose 里增加一个挂载：

```yaml
volumes:
  - /opt/eiinside/site:/usr/share/nginx/eiinside:ro
```

注意：

- 容器内部可以叫 `/usr/share/nginx/eiinside`。
- 不要和别的站点共用同一个宿主机目录。
- 服务 A 有 `index.html`，服务 B 也有 `index.html`，只要 root 不同就不会冲突。

### 6.3 给 Nginx 增加官网 server 配置

在现有 Nginx 配置目录里新增一个配置，例如：

```bash
nano /path/to/nginx/conf.d/eiinside.conf
```

示例配置：

```nginx
server {
    listen 80;
    server_name index.eiinside.com;

    root /usr/share/nginx/eiinside;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|webp|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri =404;
    }

    location /admin/ {
        auth_basic "EIINSIDE CMS";
        auth_basic_user_file /etc/nginx/eiinside.htpasswd;

        try_files $uri $uri/ =404;
    }

    location = /content/articles.json {
        limit_except GET HEAD {
            auth_basic "EIINSIDE CMS";
            auth_basic_user_file /etc/nginx/eiinside.htpasswd;
        }

        proxy_pass http://eiinside-cms:5173/content/articles.json;
    }

    location /assets/articles/ {
        limit_except GET HEAD {
            auth_basic "EIINSIDE CMS";
            auth_basic_user_file /etc/nginx/eiinside.htpasswd;
        }

        proxy_pass http://eiinside-cms:5173/assets/articles/;
    }
}
```

为什么 `/content/articles.json` 和 `/assets/articles/` 没有全量加密码：

- 公开文章列表需要 `GET /content/articles.json`。
- 文章图片需要公开 `GET /assets/articles/*`。
- 只有 `PUT` 写入时才需要 Basic Auth。

---

## 7. 配置 Basic Auth

生成账号密码文件。账号建议还是 `admin`。

如果服务器有 `htpasswd`：

```bash
htpasswd -c /opt/eiinside/deploy/eiinside.htpasswd admin
```

如果没有 `htpasswd`，可以用 Docker 生成：

```bash
docker run --rm httpd:2.4-alpine htpasswd -nbB admin '你的后台密码' > /opt/eiinside/deploy/eiinside.htpasswd
```

然后把认证文件挂载进 Nginx 容器：

```yaml
volumes:
  - /opt/eiinside/deploy/eiinside.htpasswd:/etc/nginx/eiinside.htpasswd:ro
```

重启或重载现有 Nginx：

```bash
docker exec <nginx容器名> nginx -t
docker exec <nginx容器名> nginx -s reload
```

如果你的 Nginx 容器不支持 reload，也可以：

```bash
docker restart <nginx容器名>
```

---

## 8. 如果没有现成 Nginx，使用独立 Nginx Compose

如果服务器没有别的服务占用 80/443，可以用官网自己的 Nginx。

`/opt/eiinside/deploy/compose.yaml`：

```yaml
services:
  eiinside-cms:
    image: node:20-alpine
    container_name: eiinside-cms
    working_dir: /app
    command: node local-server.js
    environment:
      PORT: 5173
    volumes:
      - /opt/eiinside/site:/app
    expose:
      - "5173"
    restart: unless-stopped

  eiinside-nginx:
    image: nginx:1.27-alpine
    container_name: eiinside-nginx
    depends_on:
      - eiinside-cms
    ports:
      - "80:80"
    volumes:
      - /opt/eiinside/site:/usr/share/nginx/eiinside:ro
      - /opt/eiinside/deploy/eiinside.conf:/etc/nginx/conf.d/default.conf:ro
      - /opt/eiinside/deploy/eiinside.htpasswd:/etc/nginx/eiinside.htpasswd:ro
    restart: unless-stopped
```

`/opt/eiinside/deploy/eiinside.conf`：

```nginx
server {
    listen 80;
    server_name index.eiinside.com;

    root /usr/share/nginx/eiinside;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|webp|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri =404;
    }

    location /admin/ {
        auth_basic "EIINSIDE CMS";
        auth_basic_user_file /etc/nginx/eiinside.htpasswd;

        try_files $uri $uri/ =404;
    }

    location = /content/articles.json {
        limit_except GET HEAD {
            auth_basic "EIINSIDE CMS";
            auth_basic_user_file /etc/nginx/eiinside.htpasswd;
        }

        proxy_pass http://eiinside-cms:5173/content/articles.json;
    }

    location /assets/articles/ {
        limit_except GET HEAD {
            auth_basic "EIINSIDE CMS";
            auth_basic_user_file /etc/nginx/eiinside.htpasswd;
        }

        proxy_pass http://eiinside-cms:5173/assets/articles/;
    }
}
```

启动：

```bash
cd /opt/eiinside/deploy
docker compose up -d
docker compose ps
```

---

## 9. 首次上线验证

服务器本机验证：

```bash
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/articles.html
curl -I http://127.0.0.1/content/articles.json
```

公网验证：

```text
http://index.eiinside.com/
http://index.eiinside.com/articles.html
http://index.eiinside.com/admin/articles-editor.html
```

浏览器验证：

- 打开首页。
- 打开文章动态。
- 打开后台编辑器。
- 输入 Basic Auth 账号密码。
- 输入编辑器前端账号密码：`admin / eiinside123qwe!@#`。
- 新建一篇草稿。
- 保存草稿。
- 发布文章。
- 刷新文章动态页，确认能看到新文章。

如果保存时提示：

```text
当前环境未开放服务器写入，已下载 articles.json。
```

说明写入请求没有转发到 `eiinside-cms`，重点检查：

```bash
docker compose logs -f --tail=100 eiinside-cms
docker exec <nginx容器名> nginx -T | grep -n "eiinside" -A 30
```

---

## 10. 每次更新官网

### 10.1 Windows 本地重新打包上传

```powershell
cd D:\work\eiinside

$REL=Get-Date -Format "yyyyMMdd-HHmmss"
$SERVER="root@<服务器公网IP>"

Compress-Archive `
  -Path .\admin,.\assets,.\content,.\about.html,.\article.html,.\articles.html,.\index.html,.\local-server.js,.\script.js,.\styles.css `
  -DestinationPath ".\eiinside-$REL.zip" `
  -Force

ssh $SERVER "mkdir -p /opt/eiinside/releases/$REL"
scp ".\eiinside-$REL.zip" "${SERVER}:/opt/eiinside/releases/$REL/"
Write-Host "本次发布版本号：$REL"
```

### 10.2 Linux 服务器备份旧版本

```bash
cd /opt/eiinside
export REL=刚才上传的版本号

tar -czf backup/site-$REL.tar.gz -C /opt/eiinside site
ls -lh backup/site-$REL.tar.gz
```

### 10.3 解压并替换文件

```bash
cd /opt/eiinside/releases/$REL
unzip -o eiinside-$REL.zip -d site

rm -rf /opt/eiinside/site/*
cp -a /opt/eiinside/releases/$REL/site/. /opt/eiinside/site/
```

### 10.4 重启 CMS，重载 Nginx

```bash
cd /opt/eiinside/deploy
docker compose restart eiinside-cms
```

如果使用独立官网 Nginx：

```bash
docker compose exec eiinside-nginx nginx -t
docker compose exec eiinside-nginx nginx -s reload
```

如果接入已有 Nginx：

```bash
docker exec <nginx容器名> nginx -t
docker exec <nginx容器名> nginx -s reload
```

### 10.5 验证

```bash
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/articles.html
curl -I http://127.0.0.1/content/articles.json
```

浏览器按 `Ctrl + F5` 强刷：

```text
http://index.eiinside.com/
http://index.eiinside.com/articles.html
```

---

## 11. 回滚

如果新版本有问题，回滚到上一次备份。

查看备份：

```bash
ls -lh /opt/eiinside/backup
```

回滚：

```bash
cd /opt/eiinside
rm -rf site
tar -xzf backup/site-要回滚的版本号.tar.gz -C /opt/eiinside
```

重启 CMS：

```bash
cd /opt/eiinside/deploy
docker compose restart eiinside-cms
```

重载 Nginx：

```bash
docker exec <nginx容器名> nginx -t
docker exec <nginx容器名> nginx -s reload
```

---

## 12. 常见问题

### 12.1 两个站点都有 index.html 会不会冲突

不会，前提是宿主机目录不同，Nginx 的 `root` 不同。

示例：

```nginx
server {
    server_name a.example.com;
    root /usr/share/nginx/service-a;
}

server {
    server_name index.eiinside.com;
    root /usr/share/nginx/eiinside;
}
```

两个站点都有：

```text
index.html
```

但真实路径不同：

```text
/usr/share/nginx/service-a/index.html
/usr/share/nginx/eiinside/index.html
```

所以不会互相覆盖。

### 12.2 会冲突的是什么

会冲突的是：

```text
两个容器都绑定宿主机 80/443
两个站点挂载同一个宿主机目录
两个 Nginx server 使用同一个 server_name
```

### 12.3 为什么 Nginx 只读挂载，CMS 可写挂载

推荐这样挂：

```yaml
Nginx:
  - /opt/eiinside/site:/usr/share/nginx/eiinside:ro

CMS:
  - /opt/eiinside/site:/app
```

意思是：

- Nginx 只能读，降低误写风险。
- CMS 可以写，用来保存文章和图片。

### 12.4 保存文章失败

现象：

```text
当前环境未开放服务器写入，已下载 articles.json。
```

排查：

```bash
docker ps | grep eiinside-cms
docker logs -f eiinside-cms
curl -i http://127.0.0.1:5173/content/articles.json
```

如果 Nginx 容器内访问不到 CMS：

```bash
docker exec -it <nginx容器名> sh
wget -S -O - http://eiinside-cms:5173/content/articles.json
```

访问不到通常是两个容器不在同一个 Docker 网络。

### 12.5 文章页面看不到新文章

检查：

```bash
cat /opt/eiinside/site/content/articles.json
```

确认文章状态是：

```json
"status": "published"
```

草稿不会出现在公开文章动态页。

---

## 13. 最短命令速查

Windows：

```powershell
cd D:\work\eiinside
$REL=Get-Date -Format "yyyyMMdd-HHmmss"
$SERVER="root@<服务器公网IP>"
Compress-Archive -Path .\admin,.\assets,.\content,.\about.html,.\article.html,.\articles.html,.\index.html,.\local-server.js,.\script.js,.\styles.css -DestinationPath ".\eiinside-$REL.zip" -Force
ssh $SERVER "mkdir -p /opt/eiinside/releases/$REL"
scp ".\eiinside-$REL.zip" "${SERVER}:/opt/eiinside/releases/$REL/"
Write-Host $REL
```

Linux：

```bash
cd /opt/eiinside
export REL=刚才输出的版本号
tar -czf backup/site-$REL.tar.gz -C /opt/eiinside site
unzip -o releases/$REL/eiinside-$REL.zip -d releases/$REL/site
rm -rf site/*
cp -a releases/$REL/site/. site/
cd deploy
docker compose restart eiinside-cms
docker compose ps
```

验证：

```bash
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/articles.html
curl -I http://127.0.0.1/content/articles.json
```
