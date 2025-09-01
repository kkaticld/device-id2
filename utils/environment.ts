import Constants from 'expo-constants';

/**
 * 检测当前应用运行环境
 */
export const getEnvironmentInfo = () => {
  const isDevelopment = __DEV__;
  const isExpoGo = Constants.executionEnvironment === 'standalone' ? false : true;
  const appOwnership = Constants.appOwnership;
  
  // 检查是否是开发构建
  const isDevelopmentBuild = Constants.executionEnvironment === 'bare' && __DEV__;
  
  // 检查是否是生产构建
  const isProductionBuild = !__DEV__ && Constants.executionEnvironment === 'bare';
  
  return {
    isDevelopment,
    isExpoGo,
    appOwnership,
    isDevelopmentBuild,
    isProductionBuild,
    executionEnvironment: Constants.executionEnvironment,
    releaseChannel: Constants.releaseChannel,
    manifest: Constants.manifest2 || Constants.manifest,
  };
};

/**
 * 检查是否需要本地网络权限
 * 只有在开发模式下才需要本地网络权限来连接 Metro 服务器
 */
export const needsLocalNetworkPermission = () => {
  const env = getEnvironmentInfo();
  // 只有开发构建需要本地网络权限
  return env.isDevelopmentBuild || (env.isDevelopment && !env.isProductionBuild);
};

/**
 * 获取环境友好的描述
 */
export const getEnvironmentDescription = () => {
  const env = getEnvironmentInfo();
  
  if (env.isProductionBuild) {
    return {
      type: 'production',
      description: '生产版本',
      needsLocalNetwork: false,
    };
  }
  
  if (env.isDevelopmentBuild) {
    return {
      type: 'development',
      description: '开发版本',
      needsLocalNetwork: true,
    };
  }
  
  if (env.isExpoGo) {
    return {
      type: 'expo-go',
      description: 'Expo Go 预览',
      needsLocalNetwork: true,
    };
  }
  
  return {
    type: 'unknown',
    description: '未知环境',
    needsLocalNetwork: env.isDevelopment,
  };
};
