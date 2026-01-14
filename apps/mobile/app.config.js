import 'dotenv/config'

const IS_DEV = process.env.APP_VARIANT === 'development'

export default {
  expo: {
    name: IS_DEV ? 'zottie (Dev)' : 'zottie',
    slug: 'zottie',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: IS_DEV ? 'zottie-dev' : 'zottie',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV
        ? 'com.chestercarmer.zottie.dev'
        : 'com.chestercarmer.zottie',
    },
    android: {
      package: IS_DEV
        ? 'com.chestercarmer.zottie.dev'
        : 'com.chestercarmer.zottie',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      [
        'react-native-auth0',
        {
          domain: process.env.AUTH0_DOMAIN,
        },
      ],
      [
        'expo-speech-recognition',
        {
          microphonePermission:
            'zottie needs access to your microphone to recognize voice commands for adding items to your grocery list.',
          speechRecognitionPermission:
            'zottie uses speech recognition to convert your voice commands into grocery items and meal prep instructions.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'fe1d5cf1-6626-44f5-989a-7ae33c7a5a3c',
      },
      auth0Domain: process.env.AUTH0_DOMAIN,
      auth0ClientId: process.env.AUTH0_CLIENT_ID,
      auth0Audience: process.env.AUTH0_AUDIENCE,
    },
    owner: 'chestercarmer',
  },
}
