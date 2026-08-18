# LxMusicTV APK — 使用说明

> 基于 `https://github.com/lyswhut/lx-music-mobile` 的 Android TV（大屏遥控）适配版。
> 工程：`mluckychu/lx-music-tv`（react-native-tvos），CI 自动构建 `app-release.apk`。
> 当前版本：**1.0.0**（versionCode 2）。

## 1. 安装到电视
- 通过 U 盘 / ADB 侧载：`adb connect <TV_IP>:5555 && adb install app-release.apk`
- 或在电视文件管理器直接打开 APK 安装（需开启「未知来源」）。

## 2. 音源说明（真源码协议）
所有音源均直连官方接口，使用纯 JS 实现签名/加解密（无原生模块依赖）：

| 音源 | 搜索 | 排行榜 | 推荐歌单 | 歌单详情 | 歌词 | 签名方式 |
|------|------|--------|----------|----------|------|----------|
| 酷我 kw | ✅ | ✅ | ✅ | ✅ | ✅ | wbdCrypto（AES-128-ECB + MD5） |
| QQ音乐 tx | ✅ | ✅ | ✅ | ✅ | ⚠️ 暂占位 | zzcSign（SHA1） |
| 网易云 wy | ✅ | ✅ | — | — | ✅ | eapi（AES-128-ECB） |
| 酷狗 kg | ✅ | — | — | — | — | 无需签名 |
| 咪咕 mg | ✅ | — | — | — | — | MD5 签名 |

> 在「设置页」可切换音源（kw / kg / mg / tx / wy）。切换后首页频道行与搜索均使用该音源。
> tx/wy 歌词：wy 已接真歌词（Netease 专用格式）；tx 歌词暂返回占位（需先取 songId，后续补）。

## 3. 播放前必做：配置播放服务器
各音源「播放地址」受反爬保护，本 App 通过 **lx-music-api-server** 获取。
首次使用前，请在 App 内 **设置页** 填入你的服务器地址（如 `http://192.168.x.x:8080`）。

快速自建（任选其一）：
- Docker：`docker run -d -p 8080:8080 ghcr.io/lyswhut/lx-music-api-server:latest`
- 或参考上游：`https://github.com/lyswhut/lx-music-api-server`

> 未配置时点击播放会提示「未配置播放服务器（lx-music-api-server）」。

## 4. 操作方式
- 方向键移动焦点，确认键进入/播放，返回键退出。
- 左侧频道栏（推荐歌单 / 各榜单）+ 右侧海报行。

## 5. 已知问题与修复记录
- **启动闪退修复**：原 `react-native-buffer` 会拉入原生模块 `react-native-fast-base64`，Hermes release 包加载即崩；已改为纯 JS `buffer`。
- 已加顶层 `ErrorBoundary`，JS 异常会显示可读信息而非黑屏闪退。

## 6. 安全提示
- 本次推送/构建使用的 GitHub PAT 仅用于 `git push` 与触发 Actions，**未写入任何文件、未提交进仓库**，可自行吊销。
- 重新构建：向 `main` 分支 push 即自动出包（Actions → Artifacts 下载）。
