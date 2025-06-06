import { useFocusEffect, useRoute } from "@react-navigation/native"
import { DateTimeFormatEnum } from "@utils/enums"
import { isAndroid, isIOS } from "@utils/platformChecker"
import { fontWeights, helpers } from "@utils/theme"
import { fontFamilies } from "@utils/theme"
import moment from "moment"
import React, { useCallback, useEffect, useRef } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { moderateScale } from "react-native-size-matters"
import {
  useAddMessageMutation,
  useGetHelpQuery,
} from "src/api/helpCenterApi/helpCenterApi"
import colors from "src/assets/colors"
import ChatInput from "src/components/ChatInput"
import { Icon } from "src/components/Icon"
import InitialsAvatar from "src/components/initialsAvatar"
import ScreenWrapper from "src/components/ScreenWrapper"
import DocumentPicker from "react-native-document-picker"
import { useMediaUploadMutation } from "src/api/mediaApi/mediaApi"
import { useAuthMeQuery } from "src/api/userApi/userApi"
import Share from "react-native-share"
import RNFetchBlob from "react-native-blob-util"
import useWebSocket from "src/socket/socket"

const MyRequestsDetailsScreen = () => {
  const route = useRoute()
  const { t } = useTranslation()
  const { id } = route.params as { id: any }

  const { data: authMe } = useAuthMeQuery()

  const scrollViewRef = useRef<FlatList>(null)
  const { data, refetch } = useGetHelpQuery({
    id: id,
  })
  const [addMessage, { isLoading: isAddMessageLoading }] =
    useAddMessageMutation()

  const [mediaUpload, { isLoading: isMediaUploadLoading }] =
    useMediaUploadMutation()

  const [message, setMessage] = useState("")
  const [fileId, setFileId] = useState<string | null>(null)

  const resetInputs = () => {
    setMessage("")
    setFileId(null)
  }

  const handleSendMessage = async () => {
    await addMessage({
      message,
      requestId: data?.id,
      file: {
        id: fileId,
      },
    })
    resetInputs()
    refetch()
  }

  const handleSendFile = async () => {
    try {
      const file = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.images,
          DocumentPicker.types.plainText,
        ],
      })

      const mediaData = await mediaUpload({
        file: {
          uri: file[0].uri,
          name: file[0].name,
          type: file[0].type,
        },
        prefix: "help_center",
        postfix: "request",
      })

      if (file[0]?.name && mediaData?.data[0]?.id) {
        const res = await addMessage({
          requestId: data?.id,
          file: {
            id: mediaData?.data[0]?.id,
          },
        })
      }
    } catch (err) {
        console.log(err, 'error handleSendFile');
      if (DocumentPicker.isCancel(err)) {
      }
    } finally {
      refetch()
    }
  }

  const requestStoragePermission = async () => {
    if (!isAndroid()) return true

    const androidVersion = Platform.Version
    if (Number(androidVersion) >= 30) {
      // Android 11+ (Scoped Storage)
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      )

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          "Permission Required",
          "Media storage permission is needed to download files. Please enable it in your settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        )
      }
      return false
    } else {
      // Android 9 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      )

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          "Permission Required",
          "Storage permission is needed to download files. Please enable it in your settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        )
      }
      return false
    }
  }
  
  const onDocumentPress = async (item: any) => {
    try {
      const { dirs } = RNFetchBlob.fs
      const dirToSave =
        Platform.OS === "ios" ? dirs.DocumentDir : dirs.DownloadDir
      const configfb = {
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          mediaScannable: true,
          title: `${item?.file?.name}.pdf`,
          path: `${dirs.DownloadDir}/${item?.file?.name}.pdf`,
        },
        useDownloadManager: true,
        notification: true,
        mediaScannable: true,
        title: `${item?.file?.name}.pdf`,
        path: `${dirToSave}/${item?.file?.name}.pdf`,
      }
      const configOptions = Platform.select({
        ios: configfb,
        android: configfb,
      })

      RNFetchBlob.config(configOptions || {})
        .fetch("GET", item?.file?.link, {})
        .then((res) => {
          if (Platform.OS === "ios") {
            RNFetchBlob.fs.writeFile(configfb.path, res.data, "base64")
            RNFetchBlob.ios.previewDocument(configfb.path)
          }
          if (isAndroid()) {
            console.log("file downloaded")
          }
        })
        .catch((e) => {
          console.log("invoice Download==>", e)
        })

      Share.open({
        url: `file://${item?.file?.link}`,
        title: "Save or Share",
      }).catch((error) => console.error("Error sharing file:", error))
    } catch (error: any) {
      console.error("Error saving file:", error?.message || error)
      Alert.alert("Download Failed", error?.message || "Something went wrong.")
    }
  }

  const handleScroll = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 250)
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isDocument = item?.file
    const messageDate = moment(item?.createdAt)
    const prevMessageDate =
      index > 0 ? moment(data?.messages[index - 1]?.createdAt) : null

    const isNewDay =
      !prevMessageDate || !messageDate.isSame(prevMessageDate, "day")

    const avatar = authMe?.photo?.link
    const isSupport = item?.createdBy?.email !== authMe?.email

    return (
      <View>
        {isNewDay && (
          <View style={styles.dateContainer}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>
              {messageDate.format("DD.MM.YYYY")}
            </Text>
            <View style={styles.dateLine} />
          </View>
        )}
        <TouchableOpacity
          disabled={!isDocument}
          onPress={() => onDocumentPress(item)}
          style={[
            styles.messageContainer,
            {
              backgroundColor: isSupport ? colors.charcoal : colors.darkGreen,
            },
            isSupport && { alignSelf: "flex-start" },
          ]}
        >
          <View style={[helpers.flexRowCenter, helpers.gap8]}>
            {isDocument ? (
              <Icon name="document" width={40} height={40} />
            ) : isSupport ? (
              <Icon name="supportManager" width={40} height={40} />
            ) : avatar ? (
              <Image
                source={{
                  uri: avatar,
                }}
                style={{
                  width: moderateScale(40),
                  height: moderateScale(40),
                  borderRadius: 50,
                }}
              />
            ) : (
              <InitialsAvatar
                firstName={item?.createdBy?.firstName || ""}
                lastName={item?.createdBy?.lastName || ""}
              />
            )}
            <View>
              {isDocument ? (
                <Text style={styles.text}>{item?.file?.name}</Text>
              ) : isSupport ? (
                <Text
                  style={[
                    styles.text,
                    isSupport && { color: colors.lightAqua },
                  ]}
                >
                  {t("SupportManager")}
                </Text>
              ) : (
                <Text style={styles.text}>
                  {item?.createdBy?.firstName} {item?.createdBy?.lastName}
                  {t("(You)")}
                </Text>
              )}
              <Text style={styles.text}>
                {moment(item?.createdAt).format(DateTimeFormatEnum.HHmm)}
              </Text>
            </View>
          </View>
          {!isDocument && <Text style={styles.text}>{item?.message}</Text>}
        </TouchableOpacity>
      </View>
    )
  }

  useWebSocket(refetch)

  useEffect(() => {
    if (data?.messages?.length) {
      handleScroll()
    }
  }, [data?.messages])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => handleScroll()
    )

    return () => {
      keyboardDidShowListener.remove()
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [])
  )

  return (
    <ScreenWrapper
      isBackButton
      title={data?.category?.name || "unknown"}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-120) : undefined}
      childrenStyle={{ paddingHorizontal: moderateScale(0) }}
    >
      <FlatList
        ref={scrollViewRef}
        scrollEnabled
        contentContainerStyle={styles.chatContainer}
        data={data?.messages}
        renderItem={renderItem}
      />
      <ChatInput
        isAddButton
        onPressAddButton={handleSendFile}
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        isLoading={isAddMessageLoading}
      />
    </ScreenWrapper>
  )
}

export default MyRequestsDetailsScreen

const styles = StyleSheet.create({
  chatContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: moderateScale(20),
    gap: moderateScale(4),
    paddingVertical: moderateScale(16),
  },
  text: {
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    color: colors.white,
  },
  messageContainer: {
    alignSelf: "flex-end",
    gap: moderateScale(8),
    borderRadius: moderateScale(16),
    padding: moderateScale(10),
  },
  dateContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    flexDirection: "row",
    gap: moderateScale(32),
  },
  dateText: {
    ...fontFamilies.interManropeRegular12,
    ...fontWeights.fontWeight400,
    color: colors.steelGray,
  },
  dateLine: {
    height: moderateScale(1),
    backgroundColor: colors.lightGray,
    flex: 1,
  },
})
