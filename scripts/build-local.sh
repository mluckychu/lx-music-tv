#!/usr/bin/env bash
# 本机构建 LxMusicTV 发布版 APK（需已安装 JDK 17 + Android SDK）。
# 用法： bash scripts/build-local.sh
set -e

cd "$(dirname "$0")/.."   # 切到工程根目录

# ---- 探测 JDK ----
if [ -z "$JAVA_HOME" ]; then
  for p in \
    "$HOME/Library/Java/JavaVirtualMachines"/*/Contents/Home \
    /Applications/Android\ Studio.app/Contents/jbr/Contents/Home \
    /usr/lib/jvm/java-17-openjdk* ; do
    if [ -x "$p/bin/java" ]; then JAVA_HOME="$p"; break; fi
  done
fi
export JAVA_HOME
[ -n "$JAVA_HOME" ] && echo "JAVA_HOME=$JAVA_HOME" || { echo "未找到 JDK 17，请先安装"; exit 1; }

# ---- 探测 Android SDK ----
if [ -z "$ANDROID_HOME" ]; then
  for p in "$HOME/Library/Android/sdk" "$HOME/Android/Sdk" "$HOME/Android/Sdk"; do
    [ -d "$p" ] && ANDROID_HOME="$p" && break
  done
fi
export ANDROID_HOME
[ -n "$ANDROID_HOME" ] && echo "ANDROID_HOME=$ANDROID_HOME" || { echo "未找到 Android SDK，请先安装并设 ANDROID_HOME"; exit 1; }

# ---- 安装必要 SDK 包（若缺失；国内可直连 Google 时执行） ----
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-34" "build-tools;34.0.0" "platform-tools" >/dev/null 2>&1 || \
"$ANDROID_HOME/tools/bin/sdkmanager" "platforms;android-34" "build-tools;34.0.0" "platform-tools" >/dev/null 2>&1 || true

echo "==> npm install"
npm install

echo "==> gradlew assembleRelease"
cd android
./gradlew assembleRelease --no-daemon

APK="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK" ]; then
  echo "✅ 构建成功：$PWD/$APK"
else
  echo "❌ 未找到 APK，请检查上方报错"
  exit 1
fi
