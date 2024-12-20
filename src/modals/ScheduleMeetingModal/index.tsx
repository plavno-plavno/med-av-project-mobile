import React, { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView } from "react-native"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import { Formik, FormikProps } from "formik"
import CustomInput from "src/components/CustomInput"
import moment from "moment-timezone"
import { Icon, CustomButton } from "@components"

import { styles } from "./styles"
import { useAppSelector } from "src/hooks/redux"
import { validationCreateEventSchema } from "@utils/validationSchemas"
import { screenHeight } from "@utils/screenResponsive"
import BottomSheet, { type BottomSheetMethods } from "@devvie/bottom-sheet"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import colors from "src/assets/colors"
import { useCreateEventMutation } from "src/api/calendarApi/calendarApi"
import Toast from "react-native-toast-message"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { navigate } from "src/navigation/RootNavigation"
import { Portal } from "react-native-portalize"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"

interface IFormValues {
  date: string
  title: string
  timezone: string
  startDate: string
  endDate: string
  participants: string[]
  color: string
  description: string
}

const mockTimeZones = [
  {
    label: "(GMT+2:00) Kyiv",
    value: "2",
  },
  {
    label: "(GMT+1:00) Warsaw",
    value: "1",
  },
]

interface IScheduleMeetingModal {
  onClose: () => void
  sheetRef: React.RefObject<BottomSheetMethods>
  isVisible: boolean
}

const ScheduleMeetingModal = ({
  onClose,
  sheetRef,
  isVisible,
}: IScheduleMeetingModal) => {
  const { t } = useTranslation()

  const { currentDate } = useAppSelector((state) => state.calendar)

  const formikRef = React.useRef<FormikProps<IFormValues>>(null as any)

  const [createEvent, { isLoading: isCreateEventLoading }] =
    useCreateEventMutation()

  const [datePickerState, setDatePickerState] = useState({
    field: "",
    mode: "date" as "date" | "time",
    isVisible: false,
  })

  const defaultTime = () => {
    const date = new Date()
    if (datePickerState.mode === "date") {
      return new Date()
    }
    date.setHours(8, 0, 0, 0)
    return date
  }

  const showDatePicker = ({
    mode,
    field,
  }: {
    mode: "date" | "time"
    field: string
  }) => {
    setDatePickerState({
      field,
      mode,
      isVisible: true,
    })
  }

  const hideDatePicker = () => {
    setDatePickerState((prev) => ({
      ...prev,
      isVisible: false,
    }))
  }

  const handleConfirm = (date: Date) => {
    const { setFieldValue } = formikRef.current as FormikProps<any>

    const fieldFormatMap: Record<(typeof datePickerState)["field"], string> = {
      date: "YYYY-MM-DD",
      startDate: "HH:mm",
      endDate: "HH:mm",
    }

    const format = fieldFormatMap[datePickerState.field]

    if (format) {
      setFieldValue(datePickerState.field, moment(date).format(format))
    } else {
      console.warn(`Invalid field: "${datePickerState.field}"`)
    }

    hideDatePicker()
  }

  return (
    <Portal>
      <BottomSheet
        ref={sheetRef}
        height={screenHeight * 0.92}
        backdropMaskColor={colors.blackOpacity08}
        style={styles.bottomSheet}
        disableBodyPanning
        disableKeyboardHandling
      >
        {isVisible && (
          <KeyboardAwareScrollView
            style={[helpers.flexGrow1]}
            bounces={false}
            enableOnAndroid
            enableAutomaticScroll
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <View
                    style={[
                      helpers.flexRow,
                      helpers.alignItemsCenter,
                      helpers.gap8,
                    ]}
                  >
                    {/* <Icon name={"backArrow"} onPress={onClose} /> */}
                    <Text style={styles.title}>{t("ScheduleMeeting")}</Text>
                  </View>
                  <Icon name={"closeButton"} onPress={onClose} />
                </View>
                <Text style={styles.subtitle}>{t("ScheduleTheMeeting")}</Text>
              </View>

              <Formik
                innerRef={formikRef}
                initialValues={{
                  title: "",
                  date: currentDate.format("YYYY-MM-DD"),
                  timezone: "",
                  startDate: "",
                  endDate: "",
                  participants: [],
                  color: "",
                  description: "",
                }}
                validationSchema={validationCreateEventSchema}
                onSubmit={async (values) => {
                  try {
                    const res = await createEvent({
                      startDate: values.date + " " + values.startDate,
                      endDate: values.date + " " + values.endDate,
                      color: values.color,
                      title: values.title,
                      description: values.description,
                      participants: values.participants,
                      gmtDelta: +values.timezone,
                    }).unwrap()

                    if (res) {
                      Toast.show({
                        type: "success",
                        text1: t("MeetingScheduled!"),
                      })
                      onClose()
                      navigate(ScreensEnum.CALENDAR)
                    }
                  } catch (error) {
                    console.log(error, "createEventError")
                  }
                }}
              >
                {({
                  handleChange,
                  handleSubmit,
                  setFieldValue,
                  values,
                  errors,
                  touched,
                }) => {
                  return (
                    <ScrollView
                      style={(helpers.flex1, helpers.width100Percent)}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.formContainer}>
                        <CustomInput
                          required
                          label="Title"
                          placeholder={t("EnterTheTitle")}
                          value={values.title}
                          onChangeText={(val) =>
                            handleChange("title")(val as string)
                          }
                          error={touched.title && errors.title}
                        />
                        <CustomInput
                          required
                          label="Date"
                          placeholder={t("Select date")}
                          value={values.date}
                          editable={false}
                          onChangeText={(val) =>
                            handleChange("date")(val as string)
                          }
                          rightIconProps={{
                            name: "calendarIcon",
                            onPress: () =>
                              showDatePicker({ mode: "date", field: "date" }),
                          }}
                          error={touched.date && errors.date}
                        />

                        <CustomInput
                          inputType="dropdown"
                          required
                          label="Timezone"
                          value={values.timezone}
                          onChangeText={(val) =>
                            handleChange("timezone")(val as string)
                          }
                          dropdownData={mockTimeZones}
                          error={touched.timezone && errors.timezone}
                        />
                        <TouchableOpacity
                          onPress={() =>
                            showDatePicker({ mode: "time", field: "startDate" })
                          }
                        >
                          <View pointerEvents="none">
                            <CustomInput
                              label="Time Start"
                              placeholder="Select start time"
                              required
                              value={values.startDate}
                              onChangeText={() => { }}
                              rightIconProps={{
                                name: "downArrow",
                              }}
                              error={touched.startDate && errors.startDate}
                            />
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            showDatePicker({ mode: "time", field: "endDate" })
                          }
                        >
                          <View pointerEvents="none">
                            <CustomInput
                              label="Time End"
                              placeholder="Select end time"
                              required
                              editable={false}
                              value={values.endDate}
                              onChangeText={() => { }}
                              rightIconProps={{
                                name: "downArrow",
                              }}
                              error={touched.endDate && errors.endDate}
                            />
                          </View>
                        </TouchableOpacity>

                        <CustomInput
                          inputType="chip"
                          label="Invite Participants"
                          required
                          placeholder="Invite participants"
                          value={values.participants}
                          onChangeText={(val) =>
                            setFieldValue("participants", val)
                          }
                          error={
                            touched.participants && errors.participants
                              ? Array.isArray(errors.participants)
                                ? errors.participants.join(", ")
                                : String(errors.participants)
                              : undefined
                          }
                        />
                        <CustomInput
                          inputType="colorPicker"
                          label="Color"
                          required
                          value={values.color}
                          subtitle={t("PickAColor")}
                          inputContainerProps={{ borderWidth: 0 }}
                          onChangeText={(val) =>
                            handleChange("color")(val as string)
                          }
                          error={touched.color && errors.color}
                        />
                        <CustomInput
                          inputType="textArea"
                          label="Description"
                          placeholder="Will discuss updates"
                          value={values.description}
                          onChangeText={(val) =>
                            handleChange("description")(val as string)
                          }
                          error={touched.description && errors.description}
                        />
                        <CustomButton
                          type="primary"
                          text={t("Schedule")}
                          isLoading={isCreateEventLoading}
                          onPress={handleSubmit}
                          style={[helpers.width100Percent, helpers.mb24]}
                        />
                      </View>
                    </ScrollView>
                  )
                }}
              </Formik>
            </View>
          </KeyboardAwareScrollView>
        )}
      </BottomSheet>
      <DateTimePickerModal
        pickerStyleIOS={helpers.flexCenter}
        date={defaultTime()}
        isVisible={datePickerState.isVisible}
        mode={datePickerState.mode}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        display={datePickerState.mode === "date" ? "inline" : undefined}
        is24Hour={false}
        minuteInterval={10}
        minimumDate={datePickerState.mode === "date" ? moment().toDate() : undefined}
      />
    </Portal>
  )
}

export default ScheduleMeetingModal
