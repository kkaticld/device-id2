# 设备广告ID获取应用

这是一个基于 [Expo](https://expo.dev) 开发的跨平台应用，专门用于获取和显示设备的广告ID（iOS IDFA 和 Android GAID）。

## 功能特性

- **iOS IDFA获取**: 支持iOS设备的广告标识符获取，集成App Tracking Transparency框架
- **Android GAID获取**: 支持Android设备的Google广告ID获取
- **跨平台支持**: iOS、Android和Web平台兼容
- **一键复制**: 支持设备ID的快速复制到剪贴板
- **权限管理**: 智能的权限请求和状态管理
- **实时状态**: 完善的加载状态和错误处理
- **简洁界面**: 清晰的分行显示布局

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动应用

```bash
npx expo start
```

在输出中，你可以选择在以下环境中打开应用：

- [开发构建](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android模拟器](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS模拟器](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)（功能受限的沙盒环境）

### 3. 真机测试

为了获得真实的广告ID，建议在真实设备上进行测试：

```bash
# iOS真机
npx expo run:ios --device

# Android真机
npx expo run:android --device
```

## 技术实现

### 核心组件

- **`hooks/useDeviceId.ts`**: 自定义Hook，处理设备ID获取逻辑
- **`app/(tabs)/index.tsx`**: 主界面组件，显示设备ID和相关操作
- **`app.json`**: 应用配置，包含权限和插件设置

### 主要依赖

- `expo-tracking-transparency`: iOS广告跟踪权限和IDFA获取
- `expo-application`: 应用信息获取
- `expo-clipboard`: 剪贴板操作
- `@expo/vector-icons`: 图标组件

## 平台支持

### iOS

- 支持iOS 14.5+的App Tracking Transparency框架
- 自动权限状态检测
- 支持权限重新请求
- 需要在真机上测试（模拟器不支持真实IDFA）

### Android

- 支持Google Play Services广告ID
- 自动获取GAID
- 无需额外权限弹窗

### Web

- 不支持广告ID获取
- 显示不可用提示

## 权限配置

### iOS权限

应用会自动请求以下权限：

- **NSUserTrackingUsageDescription**: 广告跟踪权限说明

### Android权限

- **com.google.android.gms.permission.AD_ID**: Google广告ID权限

## 使用说明

1. **启动应用**: 应用启动后会自动检测平台并尝试获取设备ID
2. **权限处理**: iOS用户首次使用时会看到权限请求弹窗
3. **查看结果**: 设备ID会显示在主界面上，格式为：
   - iOS: `IDFA: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Android: `GAID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
4. **复制功能**: 点击复制按钮可将设备ID复制到剪贴板
5. **重新授权**: 如果权限被拒绝，可点击"授权获取广告ID"按钮重新请求

## 故障排除

### iOS IDFA无法获取

1. 确保在真机上测试（模拟器不支持）
2. 检查iOS系统设置 > 隐私与安全性 > 跟踪 > 允许App请求跟踪
3. 确保应用有正确的权限配置
4. 尝试重新安装应用

### Android GAID无法获取

1. 确保设备安装了Google Play Services
2. 检查设备的广告ID设置
3. 确认网络连接正常

## 开发文档

更多详细信息请查看：

- [DEVICE_ID_FEATURE.md](./DEVICE_ID_FEATURE.md) - 功能详细说明
- [USAGE_GUIDE.md](./USAGE_GUIDE.md) - 使用指南

## 了解更多

要了解更多关于Expo开发的信息，请查看以下资源：

- [Expo文档](https://docs.expo.dev/): 学习基础知识或深入了解高级主题
- [Expo教程](https://docs.expo.dev/tutorial/introduction/): 跟随分步教程创建跨平台应用

## 社区

加入我们的开发者社区：

- [Expo GitHub](https://github.com/expo/expo): 查看开源平台并贡献代码
- [Discord社区](https://chat.expo.dev): 与Expo用户聊天并提问

## 许可证

本项目仅供学习和测试目的使用。请遵守相关平台的广告ID使用政策。
