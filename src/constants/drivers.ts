import type { ImageSourcePropType } from 'react-native';

export type DriverId = 'alonso' | 'charles' | 'girl1' | 'girl2' | 'kimi' | 'lewis' | 'max' | 'oscar';
export type DriverState = 'idle' | 'focus' | 'happy' | 'sad';

export interface DriverAssets {
  idle: ImageSourcePropType;
  focus: ImageSourcePropType;
  happy: ImageSourcePropType;
  sad: ImageSourcePropType;
  car: ImageSourcePropType;
  helmet: ImageSourcePropType;
}

export interface DriverDefinition {
  id: DriverId;
  name: string;
  team: string;
  assets: DriverAssets;
}

export const DRIVERS: Record<DriverId, DriverDefinition> = {
  alonso: {
    id: 'alonso',
    name: 'Alonso',
    team: 'Alpine',
    assets: {
      idle: require('../../assets/f1/drivers/alonso/idle.png'),
      focus: require('../../assets/f1/drivers/alonso/focus.png'),
      happy: require('../../assets/f1/drivers/alonso/happy.png'),
      sad: require('../../assets/f1/drivers/alonso/sad.png'),
      car: require('../../assets/f1/drivers/alonso/car.png'),
      helmet: require('../../assets/f1/drivers/alonso/helmet.png'),
    },
  },
  charles: {
    id: 'charles',
    name: 'Charles',
    team: 'Ferrari',
    assets: {
      idle: require('../../assets/f1/drivers/charles/idle.png'),
      focus: require('../../assets/f1/drivers/charles/focus.png'),
      happy: require('../../assets/f1/drivers/charles/happy.png'),
      sad: require('../../assets/f1/drivers/charles/sad.png'),
      car: require('../../assets/f1/drivers/charles/car.png'),
      helmet: require('../../assets/f1/drivers/charles/helmet.png'),
    },
  },
  girl1: {
    id: 'girl1',
    name: 'Aria',
    team: 'McLaren',
    assets: {
      idle: require('../../assets/f1/drivers/girl1/idle.png'),
      focus: require('../../assets/f1/drivers/girl1/focus.png'),
      happy: require('../../assets/f1/drivers/girl1/happy.png'),
      sad: require('../../assets/f1/drivers/girl1/sad.png'),
      car: require('../../assets/f1/drivers/girl1/car.png'),
      helmet: require('../../assets/f1/drivers/girl1/helmet.png'),
    },
  },
  girl2: {
    id: 'girl2',
    name: 'Zara',
    team: 'Mercedes',
    assets: {
      idle: require('../../assets/f1/drivers/girl2/idle.png'),
      focus: require('../../assets/f1/drivers/girl2/focus.png'),
      happy: require('../../assets/f1/drivers/girl2/happy.png'),
      sad: require('../../assets/f1/drivers/girl2/sad.png'),
      car: require('../../assets/f1/drivers/girl2/car.png'),
      helmet: require('../../assets/f1/drivers/girl2/helmet.png'),
    },
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    team: 'Alfa Romeo',
    assets: {
      idle: require('../../assets/f1/drivers/kimi/idle.png'),
      focus: require('../../assets/f1/drivers/kimi/focus.png'),
      happy: require('../../assets/f1/drivers/kimi/happy.png'),
      sad: require('../../assets/f1/drivers/kimi/sad.png'),
      car: require('../../assets/f1/drivers/kimi/car.png'),
      helmet: require('../../assets/f1/drivers/kimi/helmet.png'),
    },
  },
  lewis: {
    id: 'lewis',
    name: 'Lewis',
    team: 'Mercedes',
    assets: {
      idle: require('../../assets/f1/drivers/lewis/idle.png'),
      focus: require('../../assets/f1/drivers/lewis/focus.png'),
      happy: require('../../assets/f1/drivers/lewis/happy.png'),
      sad: require('../../assets/f1/drivers/lewis/sad.png'),
      car: require('../../assets/f1/drivers/lewis/car.png'),
      helmet: require('../../assets/f1/drivers/lewis/helmet.png'),
    },
  },
  max: {
    id: 'max',
    name: 'Max',
    team: 'Red Bull',
    assets: {
      idle: require('../../assets/f1/drivers/max/idle.png'),
      focus: require('../../assets/f1/drivers/max/focus.png'),
      happy: require('../../assets/f1/drivers/max/happy.png'),
      sad: require('../../assets/f1/drivers/max/sad.png'),
      car: require('../../assets/f1/drivers/max/car.png'),
      helmet: require('../../assets/f1/drivers/max/helmet.png'),
    },
  },
  oscar: {
    id: 'oscar',
    name: 'Oscar',
    team: 'McLaren',
    assets: {
      idle: require('../../assets/f1/drivers/oscar/idle.png'),
      focus: require('../../assets/f1/drivers/oscar/focus.png'),
      happy: require('../../assets/f1/drivers/oscar/happy.png'),
      sad: require('../../assets/f1/drivers/oscar/sad.png'),
      car: require('../../assets/f1/drivers/oscar/car.png'),
      helmet: require('../../assets/f1/drivers/oscar/helmet.png'),
    },
  },
};

export const DRIVER_LIST = Object.values(DRIVERS);

export const DEFAULT_DRIVER: DriverId = 'charles';

// UI Assets
export const F1Assets: {
  logo: ImageSourcePropType;
  carbonFiber: ImageSourcePropType;
  checkedFlag: ImageSourcePropType;
  checkerBox: ImageSourcePropType;
  startLights: ImageSourcePropType[];
  checkerFlagFrames: ImageSourcePropType[];
  splashFrames: ImageSourcePropType[];
  // Tab bar icons — single-color black silhouettes (work with tintColor)
  iconHome: ImageSourcePropType;
  iconFriends: ImageSourcePropType;
  iconGrid: ImageSourcePropType;
} = {
  logo: require('../../assets/f1/ui/F1Logo.png'),
  carbonFiber: require('../../assets/f1/ui/carbonFiber.png'),
  checkedFlag: require('../../assets/f1/ui/checkered-flag.png'),
  checkerBox: require('../../assets/f1/ui/CheckerdBox.png'),
  startLights: [
    require('../../assets/f1/ui/startLights/startLights0.png'),
    require('../../assets/f1/ui/startLights/startLights1.png'),
    require('../../assets/f1/ui/startLights/startLights2.png'),
    require('../../assets/f1/ui/startLights/startLights3.png'),
    require('../../assets/f1/ui/startLights/startLights4.png'),
    require('../../assets/f1/ui/startLights/startLights5.png'),
  ],
  // 16-frame checkered flag waving animation
  checkerFlagFrames: [
    require('../../assets/f1/ui/checkerFlag/0.gif'),
    require('../../assets/f1/ui/checkerFlag/1.gif'),
    require('../../assets/f1/ui/checkerFlag/2.gif'),
    require('../../assets/f1/ui/checkerFlag/3.gif'),
    require('../../assets/f1/ui/checkerFlag/4.gif'),
    require('../../assets/f1/ui/checkerFlag/5.gif'),
    require('../../assets/f1/ui/checkerFlag/6.gif'),
    require('../../assets/f1/ui/checkerFlag/7.gif'),
    require('../../assets/f1/ui/checkerFlag/8.gif'),
    require('../../assets/f1/ui/checkerFlag/9.gif'),
    require('../../assets/f1/ui/checkerFlag/10.gif'),
    require('../../assets/f1/ui/checkerFlag/11.gif'),
    require('../../assets/f1/ui/checkerFlag/12.gif'),
    require('../../assets/f1/ui/checkerFlag/13.gif'),
    require('../../assets/f1/ui/checkerFlag/14.gif'),
    require('../../assets/f1/ui/checkerFlag/15.gif'),
  ],
  // 18-frame charles animation (used on loading/splash screen)
  splashFrames: [
    require('../../assets/f1/ui/splash/0.gif'),
    require('../../assets/f1/ui/splash/1.gif'),
    require('../../assets/f1/ui/splash/2.gif'),
    require('../../assets/f1/ui/splash/3.gif'),
    require('../../assets/f1/ui/splash/4.gif'),
    require('../../assets/f1/ui/splash/5.gif'),
    require('../../assets/f1/ui/splash/6.gif'),
    require('../../assets/f1/ui/splash/7.gif'),
    require('../../assets/f1/ui/splash/8.gif'),
    require('../../assets/f1/ui/splash/9.gif'),
    require('../../assets/f1/ui/splash/10.gif'),
    require('../../assets/f1/ui/splash/11.gif'),
    require('../../assets/f1/ui/splash/12.gif'),
    require('../../assets/f1/ui/splash/13.gif'),
    require('../../assets/f1/ui/splash/14.gif'),
    require('../../assets/f1/ui/splash/15.gif'),
    require('../../assets/f1/ui/splash/16.gif'),
    require('../../assets/f1/ui/splash/17.gif'),
  ],
  iconHome:    require('../../assets/f1/ui/icon-home.png'),
  iconFriends: require('../../assets/f1/ui/icon-friends.png'),
  iconGrid:    require('../../assets/f1/ui/checkered-flag.png'), // GRID tab
  // GARAGE tab uses the user's own driver helmet from DRIVERS[avatarId].assets.helmet
};
