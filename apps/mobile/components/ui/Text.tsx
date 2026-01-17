import { Text as RNText, TextProps as RNTextProps } from 'react-native'
import { useTheme } from '../../lib/theme'

type TextVariant =
  | 'title.large'
  | 'title.medium'
  | 'title.small'
  | 'body.primary'
  | 'body.secondary'
  | 'caption'

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse'

interface TextProps extends RNTextProps {
  variant?: TextVariant
  color?: TextColor
}

export function Text({
  variant = 'body.primary',
  color = 'primary',
  style,
  ...props
}: TextProps) {
  const { colors, typography } = useTheme()

  const getTypographyStyle = () => {
    switch (variant) {
      case 'title.large':
        return typography.title.large
      case 'title.medium':
        return typography.title.medium
      case 'title.small':
        return typography.title.small
      case 'body.primary':
        return typography.body.primary
      case 'body.secondary':
        return typography.body.secondary
      case 'caption':
        return typography.caption
    }
  }

  const textColor = colors.text[color]

  return (
    <RNText
      style={[getTypographyStyle(), { color: textColor }, style]}
      {...props}
    />
  )
}
