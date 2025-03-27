import React, { Ref, useEffect } from "react"
import { View, FlatList, TouchableOpacity, Text } from "react-native"
import { CustomButton, Icon } from "@components"
import BottomSheet, { BottomSheetMethods } from "@devvie/bottom-sheet"
import { screenHeight } from "@utils/screenResponsive"
import colors from "src/assets/colors"
import ModalHeader from "src/components/ModalHeader"
import { helpers } from "@utils/theme"
import { useTranslation } from "react-i18next"
import { styles } from "./styles"
import { useLanguageOptionsQuery } from "src/api/auth/authApi"
import { ILanguageOptions } from "src/api/auth/types"
import { useAuthMeQuery } from "src/api/userApi/userApi"

type SubtitlesContent = {
  id: number
  title: string
  icon: string
  onPress: () => void
}

type LanguagesContent = ILanguageOptions

type FlatListItem = SubtitlesContent | LanguagesContent

interface IParticipantsModal {
  sheetRef: React.RefObject<BottomSheetMethods>
  setIsCaptionOn: (val: boolean) => void
  isCaptionOn: boolean
  handleChangedRoomLanguage: (arg0: string) => void
  speechLanguage: any
}

const SubtitlesModal = ({
  sheetRef,
  setIsCaptionOn,
  isCaptionOn,
  handleChangedRoomLanguage,
  speechLanguage,
}: IParticipantsModal) => {
  const { t } = useTranslation()
  const { data: languageOptions } = useLanguageOptionsQuery()
  const [isSpeechLanguage, setIsSpeachLanguage] = React.useState(false)
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>(
    speechLanguage.current
  )
  const [selectedSpeechLanguage, setSelectedSpeechLanguage] =
    React.useState<string>("")
  const [isChangeLanguageMode, setIsChangeLanguageMode] = React.useState(false)
  const { data: authMeData } = useAuthMeQuery()

  useEffect(() => {
    if (authMeData?.outputLanguage?.code) {
      setSelectedLanguage(authMeData?.outputLanguage?.code?.toLowerCase?.())
    }
  }, [authMeData?.outputLanguage?.code])

  const handleToggleSubtitles = () => {
    setIsCaptionOn(!isCaptionOn)
    sheetRef.current?.close()
  }

  const handleChangeLanguage = () => {
    setIsChangeLanguageMode(true)
    setIsSpeachLanguage(false)
  }
  const handleChangeSpeechLanguage = () => {
    setIsChangeLanguageMode(true)
    setIsSpeachLanguage(true)
  }
  const subtitlesContent: SubtitlesContent[] = [
    {
      id: 1,
      title: isCaptionOn ? t("HideSubtitles") : t("ShowSubtitles"),
      icon: "showSubtitles",
      onPress: handleToggleSubtitles,
    },
    {
      id: 2,
      title: t("ChangeSubtitlesLanguage"),
      icon: "subtitlesLanguage",
      onPress: handleChangeLanguage,
    },
    {
      id: 3,
      title: t("ChangeSpeechLanguage"),
      icon: "subtitlesLanguage",
      onPress: handleChangeSpeechLanguage,
    },
  ]

  const languagesContent: ILanguageOptions[] = Array.isArray(languageOptions)
    ? languageOptions
    : []

  const renderItem = ({ item }: { item: FlatListItem }) => {
    if ("icon" in item) {
      return (
        <TouchableOpacity style={styles.item} onPress={item.onPress}>
          <Icon name={item.icon as any} />
          <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>
      )
    } else {
      const handlePress = () => {
        const selectedCode = item?.code?.toLowerCase?.()

        setIsChangeLanguageMode(false)

        if (isSpeechLanguage) {
          speechLanguage.current = selectedCode
          setSelectedSpeechLanguage(selectedCode)
        } else {
          handleChangedRoomLanguage(selectedCode)
          setSelectedLanguage(selectedCode)
        }
      }
      const isSelected = isSpeechLanguage
        ? selectedSpeechLanguage === item.code?.toLowerCase?.()
        : selectedLanguage === item.code?.toLowerCase?.()
      return (
        <TouchableOpacity style={styles.languageItem} onPress={handlePress}>
          <Text style={styles.title}>{item.name}</Text>
          {isSelected && <Icon name="checkCoral" />}
        </TouchableOpacity>
      )
    }
  }

  const handleSelectLanguage = () => {
    setIsChangeLanguageMode(false)
  }
  const handleOnClose = () => {
    setIsChangeLanguageMode(false)
    setTimeout(() => {
      sheetRef.current?.close()
    })
  }

  return (
    <BottomSheet
      ref={sheetRef}
      height={isChangeLanguageMode ? screenHeight * 0.9 : screenHeight * 0.35}
      backdropMaskColor={colors.blackOpacity08}
      style={styles.bottomSheet}
      disableBodyPanning
    >
      <View style={styles.container}>
        <ModalHeader
          handleBackButtonPress={() => setIsChangeLanguageMode(false)}
          isBackButton={isChangeLanguageMode}
          title={isChangeLanguageMode ? t("ChangeLanguage") : t("Subtitles")}
          onClose={handleOnClose}
        />
        <FlatList
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={[
            isChangeLanguageMode ? helpers.gap4 : helpers.gap12,
          ]}
          data={isChangeLanguageMode ? languagesContent : subtitlesContent}
          renderItem={renderItem}
          keyExtractor={(item) =>
            String(item.id || (item as LanguagesContent).id)
          }
        />
      </View>
      {isChangeLanguageMode && (
        <CustomButton
          type="primary"
          text={t("Select")}
          onPress={handleSelectLanguage}
          style={styles.selectButton}
        />
      )}
    </BottomSheet>
  )
}

export default SubtitlesModal
