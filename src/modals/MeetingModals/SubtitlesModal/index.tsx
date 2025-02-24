import React, { MutableRefObject, useEffect } from "react"
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
  setSubtitleLanguage: (val: string) => void
  isCaptionOn: boolean
  allLanguagesRef: MutableRefObject<string[]>;
  handleChangedRoomLanguage: (arg0: string) => void
}

const SubtitlesModal = ({
  sheetRef,
  setIsCaptionOn,
  isCaptionOn,
  allLanguagesRef,
  setSubtitleLanguage,
  handleChangedRoomLanguage,
}: IParticipantsModal) => {
  const { t } = useTranslation()

  const { data: languageOptions } = useLanguageOptionsQuery()
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>("")
  const [isChangeLanguageMode, setIsChangeLanguageMode] = React.useState(false)
  const { data: authMeData } = useAuthMeQuery()

  useEffect(() => {
    if (authMeData?.language?.code) {
      setSelectedLanguage(authMeData?.language?.code?.toLowerCase?.())
    }
  }, [authMeData?.language?.code]);

  useEffect(() => {
    if (languageOptions?.length) {
      allLanguagesRef.current = languageOptions.map(lang => lang.code.toLowerCase());
    }
  }, [languageOptions]);


  const handleToggleSubtitles = () => {
    setIsCaptionOn(!isCaptionOn)
    sheetRef.current?.close()
  }

  const handleChangeLanguage = () => {
    setIsChangeLanguageMode(true)
  }

  const subtitlesContent: SubtitlesContent[] = [
    {
      id: 1,
      title: isCaptionOn ? t('HideSubtitles') : t("ShowSubtitles"),
      icon: "showSubtitles",
      onPress: handleToggleSubtitles,
    },
    {
      id: 2,
      title: t("ChangeSubtitlesLanguage"),
      icon: "subtitlesLanguage",
      onPress: handleChangeLanguage,
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
      return (
        <TouchableOpacity
          style={styles.languageItem}
          onPress={() => {
            handleChangedRoomLanguage(item?.code?.toLowerCase?.())
            setSelectedLanguage(item.code?.toLowerCase())
          }}
        >
          <Text style={styles.title}>{item.name}</Text>
          {selectedLanguage === item.code?.toLowerCase?.() && <Icon name={"checkCoral"} />}
        </TouchableOpacity>
      )
    }
  }

  const handleSelectLanguage = () => {
    setSubtitleLanguage(selectedLanguage)
    setIsChangeLanguageMode(false)
  }

  return (
    <BottomSheet
      ref={sheetRef}
      height={isChangeLanguageMode ? screenHeight * 0.4 : screenHeight * 0.3}
      backdropMaskColor={colors.blackOpacity08}
      style={styles.bottomSheet}
      disableBodyPanning
    >
      <View style={styles.container}>
        <ModalHeader
          handleBackButtonPress={() => setIsChangeLanguageMode(false)}
          isBackButton={isChangeLanguageMode}
          title={isChangeLanguageMode ? t("ChangeLanguage") : t("Subtitles")}
          sheetRef={sheetRef}
        />
        <FlatList
          contentContainerStyle={
            isChangeLanguageMode ? helpers.gap4 : helpers.gap12
          }
          data={isChangeLanguageMode ? languagesContent : subtitlesContent}
          renderItem={renderItem}
          keyExtractor={(item) =>
            String(item.id || (item as LanguagesContent).id)
          }
        />
        {isChangeLanguageMode && (
          <CustomButton
            type="primary"
            text={t("Select")}
            onPress={handleSelectLanguage}
          />
        )}
      </View>
    </BottomSheet>
  )
}

export default SubtitlesModal
