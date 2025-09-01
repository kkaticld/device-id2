# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 项目概述

这是一个基于 Expo Router 的 React Native 应用项目，主要功能是获取和显示设备广告ID（GAID/IDFA）。项目使用了 Expo SDK 53，具备以下特性：

- **Framework**: Expo + React Native
- **主要功能**: 设备广告ID获取和显示
- **UI**: 简洁的居中显示设计
- **语言**: TypeScript
- **平台支持**: iOS、Android、Web
- **新架构**: 启用了 React Native New Architecture

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# 启动特定平台
npx expo start --ios        # iOS 模拟器
npx expo start --android    # Android 模拟器  
npx expo start --web        # Web 浏览器
```

## 项目结构

```
app/                    # Expo Router 路由目录
├── (tabs)/            # 标签栏导航组
│   ├── _layout.tsx    # 标签栏布局
│   ├── index.tsx      # 主页
│   └── explore.tsx    # 探索页
├── _layout.tsx        # 根布局
└── +not-found.tsx     # 404 页面

components/            # 可复用组件
├── ui/               # UI 基础组件
├── ThemedText.tsx    # 主题文本组件
├── ThemedView.tsx    # 主题视图组件
├── Collapsible.tsx   # 可折叠组件
└── ...

constants/            # 常量定义
└── Colors.ts         # 颜色主题配置

hooks/               # 自定义 Hooks
├── useColorScheme.ts     # 颜色方案钩子
├── useColorScheme.web.ts # Web 版本
└── useThemeColor.ts      # 主题颜色钩子

scripts/             # 构建脚本
└── reset-project.js # 项目重置脚本
```

## 常用命令

### 开发命令
```bash
# 启动开发服务器（会显示二维码）
npx expo start

# 清除缓存启动
npx expo start --clear

# 开发模式下的特定平台启动
npm run ios         # 等同于 npx expo start --ios
npm run android     # 等同于 npx expo start --android  
npm run web         # 等同于 npx expo start --web
```

### 代码质量
```bash
# 运行 ESLint 检查
npm run lint

# TypeScript 类型检查
npx tsc --noEmit
```

### 项目重置
```bash
# 重置项目到空白状态（移动现有代码到 app-example 目录）
npm run reset-project
```

### 工具命令
```bash
# 检查项目配置和依赖
npx expo doctor

# 查看项目信息
npx expo whoami
```

## 架构和设计模式

### 路由架构
项目使用 **Expo Router** 实现文件基础路由：
- `app/_layout.tsx`: 根布局，配置导航主题和字体
- `app/(tabs)/_layout.tsx`: 标签栏布局，定义底部导航
- 路由自动基于文件系统结构生成

### 主题系统
实现了完整的明暗模式支持：
- `constants/Colors.ts`: 定义明暗主题色彩
- `hooks/useColorScheme.ts`: 检测系统色彩方案
- `hooks/useThemeColor.ts`: 获取主题相关颜色
- `ThemedText` 和 `ThemedView`: 自动适应主题的基础组件

### 组件设计
- **基础组件**: `ThemedText`, `ThemedView` 提供主题感知能力
- **UI 组件**: 平台特定的 UI 组件 (如 `IconSymbol`)
- **功能组件**: `Collapsible`, `ParallaxScrollView` 等交互组件

### 样式管理
- 使用 React Native 内置的 `StyleSheet.create()`
- 通过 `useThemeColor` 钩子实现动态主题切换
- 支持通过 props 覆盖主题颜色

## 开发指南

### 主要功能
应用的核心功能是在首页显示设备广告ID：
- **显示格式**: "GAID: xxxxxxxx" 居中显示
- **复制功能**: 点击右侧剪贴板图标复制ID
- **状态管理**: 自动处理加载、成功和错误状态
- **权限处理**: iOS上自动请求广告跟踪权限

### 设备ID获取逻辑
使用自定义Hook `useDeviceId`：

```typescript
import { useDeviceId } from '@/hooks/useDeviceId';

const { deviceId, isLoading, error } = useDeviceId();
```

### 复制功能实现
使用 `expo-clipboard` 实现复制功能：

```typescript
import * as Clipboard from 'expo-clipboard';

const handleCopyToClipboard = async () => {
  if (deviceId) {
    await Clipboard.setStringAsync(deviceId);
    Alert.alert('复制成功', 'GAID 已复制到剪贴板');
  }
};
```

### 路径别名
项目配置了 `@/*` 路径别名指向根目录：

```typescript
import { ThemedText } from '@/components/ThemedText';
import { useDeviceId } from '@/hooks/useDeviceId';
```

## 重要配置文件

### `app.json`
Expo 应用配置文件，包含：
- 应用名称、版本、图标配置
- 平台特定设置 (iOS、Android、Web)
- 插件配置 (expo-router、expo-splash-screen)
- 新架构启用 (`"newArchEnabled": true`)

### `package.json`
- 主入口: `"main": "expo-router/entry"`
- 关键依赖: expo-router, react-navigation 系列
- 开发脚本定义

### `tsconfig.json`
- 继承 `expo/tsconfig.base`
- 启用严格模式 (`"strict": true`)
- 配置路径别名 (`"@/*": ["./*"]`)

## 调试和测试

### 调试工具
- **Flipper**: 用于网络请求和状态调试
- **React DevTools**: 组件树查看
- **Expo DevTools**: 通过浏览器访问 http://localhost:19002

### 真机测试
1. 安装 Expo Go 应用
2. 扫描开发服务器显示的二维码
3. 或使用 Development Build 进行更深度调试

### 性能监控
使用 Expo 内置工具：
```bash
# 性能分析
npx expo start --dev-client
```

## 故障排除

### 常见问题

**Metro bundler 缓存问题**:
```bash
npx expo start --clear
# 或者
npx expo r -c
```

**Node modules 问题**:
```bash
rm -rf node_modules
npm install
```

**iOS 模拟器无法启动**:
```bash
# 确保 Xcode 和 iOS 模拟器已安装
npx expo run:ios
```

**Android 构建问题**:
```bash
# 清理 Android 构建缓存
npx expo run:android --clear
```

**TypeScript 类型错误**:
```bash
# 重新生成类型定义
npx expo install --fix
```
