import { ReactNode, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { SvgXml } from 'react-native-svg';

type Props = {
  xml: string;
  height: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Renders a tiled Hero Pattern SVG as a clipped header background.
 * Border radius is applied on the container so the pattern fills the slot.
 */
export function PatternHeader({ xml, height, style, children }: Props) {
  // Stable per-mount id so duplicate patterns on one screen do not clash
  const instanceId = useRef(`i${Math.floor(Math.random() * 1e9).toString(36)}`).current;
  const [size, setSize] = useState({ w: 0, h: height });

  const safeXml = useMemo(() => {
    const suffix = `-${instanceId}`;
    return xml
      .replace(/\bid=(['"])(g-[^'"]+)\1/g, (_m, q, id) => `id=${q}${id}${suffix}${q}`)
      .replace(/url\(#(g-[^)]+)\)/g, (_m, id) => `url(#${id}${suffix})`)
      .replace(/\bid=(['"])(p-[^'"]+)\1/g, (_m, q, id) => `id=${q}${id}${suffix}${q}`)
      .replace(/url\(#(p-[^)]+)\)/g, (_m, id) => `url(#${id}${suffix})`);
  }, [xml, instanceId]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    if (width > 0 && (width !== size.w || h !== size.h)) {
      setSize({ w: width, h: h || height });
    }
  };

  return (
    <View style={[styles.wrap, { height }, style]} onLayout={onLayout}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {size.w > 0 ? (
          <SvgXml
            xml={safeXml}
            width={size.w}
            height={size.h}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
    alignSelf: 'stretch',
  },
});

export default PatternHeader;
