import { ReactNode } from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

type Props = {
    onPress?: TouchableOpacityProps['onPress'];
    style?: TouchableOpacityProps['style'];
    backgroundColor?: string;
    borderColor?: string;
    children?: ReactNode
}

export default function ButtonAbs({ onPress, style, backgroundColor, borderColor, children}: Props) {
    return (
        <TouchableOpacity style={[{
            height: 64,
            width: '90%',
            borderRadius: 16,
            borderWidth:1,
            borderColor: borderColor,
            backgroundColor:backgroundColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent:'center',
            gap: 8
        }, style]}
            onPress={onPress}
        >
            {children}
        </TouchableOpacity>
    )
}