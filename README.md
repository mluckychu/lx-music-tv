# 洛雪音乐 TV 版 (lx-music-tv)

基于 [lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile) 思路，为**大屏电视**重新设计的音乐客户端。
技术栈：**React Native (react-native-tvos) + TypeScript + Zustand**，目标平台 **Android TV**（智能电视 / TV 盒子）。

> 本工程为**独立 TV 工程**：原生 `android/` 目录已按 RN 0.73.0 官方模板生成并改造为 Android TV 形态，`react-native` 通过 npm 别名指向 `react-native-tvos`，原生构建自动使用 TV 版 AAR。

---

## 已实现的核心能力

| 需求 | 实现 |
| --- | --- |
| 大屏遥控导航（方向键 + 确认键） | `src/navigation/`：纯逻辑空间焦点算法 `spatialNav.ts` + `FocusContext`/`Focusable` + `RemoteHandler`（基于 react-native-tvos 的 `TVEventHandler`，Android TV 的 DPAD 自动映射） |
| 适配 1920×1080 及以上分辨率 | `src/theme/tvTheme.ts`：以 1920 宽为基准、按实际屏宽等比缩放，2K/4K 自动放大 |
| 适合远距离观看的字体/图标 | 字号约为移动端的 1.8~2.2 倍（正文 ≥ 26dp），焦点态高对比描边 + 外发光 |
| 电视节目式分类浏览 | `HomeScreen` 以"频道行 / 海报带"组织：为你推荐、排行榜、曲风频道、歌手、场景电台；`ChannelRow` 水平滚动海报，`CategoryScreen` 进入后展示歌曲列表 |
| 接真实音源 | `src/sources/`：统一 `MusicSource` 接口，内置 `MockSource`（离线演示）+ `HttpSource`（指向真实音源服务，设置页填地址即生效） |

---

## 目录结构

```
lx-music-tv/
├── index.js                      # RN 入口（注册组件名 LxMusicTv）
├── app.json                      # name = LxMusicTv
├── package.json                  # react-native 别名 react-native-tvos@0.73.0-0
├── babel.config.js / metro.config.js / tsconfig.json
├── android/                      # ★ 已生成的 Android TV 原生工程（可直接构建）
│   ├── settings.gradle           # rootProject.name = LxMusicTv
│   ├── build.gradle              # AGP 7.4.2 / compileSdk 34 / kotlin 1.8
│   ├── gradle/wrapper/           # Gradle 8.3 wrapper（含 gradle-wrapper.jar）
│   └── app/
│       ├── build.gradle          # namespace/applicationId = com.lxmusictv
│       └── src/main/
│           ├── AndroidManifest.xml   # LEANBACK_LAUNCHER + 非触摸 + banner
│           ├── java/com/lxmusictv/   # MainActivity / MainApplication (Kotlin)
│           └── res/drawable/banner.xml  # TV 主屏横幅（建议替换为 320x180 PNG）
├── src/                          # 见上表各模块
└── test/                         # 纯逻辑单测 (spatialNav / httpSource)
```

---

## 环境要求（构建 APK 的本机环境）

Android TV 的 APK 必须用 **Android SDK + JDK + Gradle** 编译，本工程已自带 Gradle wrapper（首次构建会自动下载 Gradle 8.3，需联网）。

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| **JDK** | **17** | React Native 0.73 要求 JDK 17（不是 11/21）。可用 Adoptium Temurin 17 |
| **Android SDK** | Platform 34 + Build-Tools 34.0.0 | `sdkmanager "platforms;android-34" "build-tools;34.0.0"` |
| **Android SDK 工具** | platform-tools, cmdline-tools | `adb` 用于安装到电视 |
| **Node.js** | ≥ 18 | 安装 npm 依赖、运行 Metro |

设置环境变量（macOS/Linux 写入 `~/.zshrc` 或 `~/.bashrc`）：

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # 或你的 JDK17 路径
export ANDROID_HOME=$HOME/Library/Android/sdk       # Windows: %LOCALAPPDATA%\Android\Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

---

## 出包方式

### 方式 A：GitHub Actions 云端一键出包（推荐，本机无需装 SDK）

本工程已内置 `.github/workflows/build-apk.yml`。把工程内容作为 GitHub 仓库根目录推送后，CI 会在自带 JDK17+Android SDK 的 runner 上自动编译，并在 **Artifacts** 中提供 `app-release.apk`。

```bash
# 1) 新建一个 GitHub 仓库，把本工程全部内容（含 .github/）推到 main 分支
git init && git add -A && git commit -m "init lx-music-tv"
git remote add origin https://github.com/<你>/<仓库>.git
git push -u origin main

# 2) 打开仓库 Actions 页面 → 等待 "Build LxMusicTV APK" 完成
# 3) 在 Artifacts 区下载 lx-music-tv-release（即 app-release.apk）
```

也可在 Actions 页面手动点 **Run workflow** 触发。无需本机安装任何 Android 工具。

### 方式 B：本机构建（需已装 JDK17 + Android SDK）

```bash
cd lx-music-tv

# 1) 安装 JS 依赖（react-native 别名会自动拉取 react-native-tvos 并创建 node_modules/react-native 符号链接）
npm install

# 2) 运行纯逻辑单测（可选）
npm test

# 3) 构建 Release APK（自动下载 Gradle 8.3 与 Android 依赖，首次较慢）
npm run apk                 # 等价于 cd android && ./gradlew assembleRelease
#   调试包：npm run apk:debug

# 或一键脚本（自动探测 JDK/SDK 环境）：
bash scripts/build-local.sh
```

构建产物：

```
android/app/build/outputs/apk/release/app-release.apk
```

> **签名说明**：当前 `android/app/build.gradle` 的 `release` 使用 `signingConfigs.debug`（即 `debug.keystore`）签名——这能直接 **adb 侧载安装** 到电视，但**不能**上架 Google Play。需要正式发布时，请按 https://reactnative.dev/docs/signed-apk-android 生成自己的 release keystore 并替换。

---

## 安装到 Android TV

```bash
# 方式一：USB / 同一局域网 adb 连接电视（电视需开启「开发者选项 → 网络调试」）
adb connect <电视IP>:5555
adb install android/app/build/outputs/apk/release/app-release.apk

# 方式二：直接用 RN CLI 跑（会先构建再安装并启动，需已连设备/模拟器）
npx react-native run-android
```

电视主屏出现「洛雪音乐 TV」图标（来自 `LEANBACK_LAUNCHER` + `banner.xml`）。遥控器方向键移动焦点、确认键进入、返回键退出。

---

## 真实音源协议（HttpSource）

在「设置」页填入音源服务地址后，TV 版即可播放真实音乐。服务需实现以下接口
（与社区常见 lx-music 兼容源一致，可按你的源微调）：

```
GET {base}/search?keyword=&source=&limit=&page=
     -> { list: [ { id, name, singer, album, interval?, pic? } ] }
GET {base}/musicUrl?id=&source=&quality=
     -> { url } | "字符串音频地址"
GET {base}/lyric?id=&source=
     -> { lyric } | "字符串歌词"
GET {base}/songlist?id=&source=
     -> { list: [ ... ] }
GET {base}/toplist?source=&id=
     -> { list: [ ... ] }
GET {base}/home        (可选) -> { channels: ChannelRow[] }
```

解析时兼容字段别名（`name`/`songname`、`singer`/`songer`、`album`/`albumname` 等），并兜底容错。
内置 `MockSource` 在无真实音源时提供完整离线演示（搜索/播放/歌词/歌单均可用，但不出声）。

---

## 验证情况

- ✅ `spatialNav` 空间焦点算法：3×3 网格方向导航、带垂直偏移择优、边界回环 —— 单测通过
- ✅ `httpSource` 请求构造：URL 拼接、中文编码、空值过滤、字段别名归一化 —— 单测通过
- ✅ 原生 `android/` 工程已按 RN 0.73.0 官方模板生成，并改造为 Android TV（LEANBACK_LAUNCHER、非触摸声明、banner、`com.lxmusictv` 包名、Gradle 8.3 wrapper）
- ⚠️ **沙箱出包说明**：本开发沙箱已实测——JDK、platform-tools、platform-34、Maven 镜像、Gradle 分发均可取得，但 **`build-tools;34.0.0` 的 macOS 二进制在墙内无法获取**（Google 主站被墙、各国内镜像要么 404 要么仅提供错位的 API14 老包、公共代理均不通）。因此沙箱内无法本地编译出 APK。
  - 工程本身**完全具备出包条件**：`release` 用 `debug.keystore` 签名可直接侧载、Gradle wrapper 齐全、JS 已通过 Metro 打包验证（零解析错误）、版本与 react-native-tvos 对齐。
  - **拿到 APK 的最快路径**是方式 A（GitHub Actions 云端构建）：runner 可直连 Google 拉取 build-tools，推送后自动产出 `app-release.apk`，无需你本机装任何 Android 工具。也支持方式 B 在本机（能直连 Google 的环境）构建。

---

## 已知限制 / 后续

- 真实音频播放需在 `PlayerScreen` 接入音频播放器（如 `react-native-video`，TV 端建议用 `react-native-track-player`），目前预留了 `url` 接入点与演示态进度模拟。
- 文本输入（搜索/音源地址）依赖外接键盘；纯遥控器输入可后续加屏幕软键盘。
- `banner.xml` 为矢量占位横幅，建议替换为 `res/drawable/banner.png`（320×180）以获得最佳电视主屏效果。
- 可按需补充更多"电视节目式"布局（如节目预告卡片、连续播放列表）。
