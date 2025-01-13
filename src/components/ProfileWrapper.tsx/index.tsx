import { screenHeight } from "@utils/screenResponsive"
import { fontFamilies, fontWeights } from "@utils/theme"
import { Image, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { Icon } from "../Icon"
import { useAuthMeQuery } from "src/api/userApi/userApi"

interface IProfileWrapper {
  children: React.ReactNode
}

const ProfileWrapper = ({ children }: IProfileWrapper) => {
  const { data: authMe } = useAuthMeQuery()

  const photo = authMe?.photo?.link
  const fullName = `${authMe?.firstName} ${authMe?.lastName}`
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.saveAreaView} edges={["top"]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <Icon
            name="avatarEmpty"
            width={moderateScale(88)}
            height={moderateScale(88)}
          />
        )}
        <Text style={styles.title}>{fullName ? fullName : authMe?.email}</Text>
      </SafeAreaView>
      {children}
    </View>
  )
}
export default ProfileWrapper

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  saveAreaView: {
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(8),
    backgroundColor: colors.darkCyan,
    height: screenHeight * 0.3,
    borderBottomLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
  },
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.white,
  },
  avatar: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: 50,
  },
})
