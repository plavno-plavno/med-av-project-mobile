import React, { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import { Formik, FormikProps } from "formik"
import CustomInput from "src/components/CustomInput"
import moment from "moment-timezone"
import { Icon, CustomButton } from "@components"

import { useAppSelector } from "src/hooks/redux"
import { validationCreateEventSchema } from "@utils/validationSchemas"
import { screenHeight } from "@utils/screenResponsive"
import BottomSheet, { type BottomSheetMethods } from "@devvie/bottom-sheet"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import {
  useCreateEventMutation,
  useGetCalendarEventDetailsQuery,
  useGetCalendarRecentQuery,
  useUpdateEventMutation,
} from "src/api/calendarApi/calendarApi"
import Toast from "react-native-toast-message"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { navigate } from "src/navigation/RootNavigation"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { styles } from "./styles"
import colors from "src/assets/colors"
import { useAuthMeQuery } from "src/api/userApi/userApi"

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
  handleGoModalBack?: () => void
  sheetRef: React.RefObject<BottomSheetMethods>
  eventId?: number
  refetch?: () => void
}

const ScheduleMeetingModal = ({
  onClose,
  sheetRef,
  eventId,
  handleGoModalBack,
  refetch,
}: IScheduleMeetingModal) => {
  const { t } = useTranslation()
  const { currentDate } = useAppSelector((state) => state.calendar)
  const formikRef = React.useRef<FormikProps<IFormValues>>(null as any)
  const isEditMode = !!eventId

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [createEvent, { isLoading: isCreateEventLoading }] =
    useCreateEventMutation()

  const { data: eventDetailsData, refetch: eventDetailsRefetch } =
    useGetCalendarEventDetailsQuery({ id: eventId || 0 }, { skip: !eventId })

  const [updateEvent, { isLoading: isUpdateEventLoading }] =
    useUpdateEventMutation()

  const { data: authMe } = useAuthMeQuery()
  console.log(authMe, "authMe")

  const { data: getCalendarRecent } = useGetCalendarRecentQuery()

  const [datePickerState, setDatePickerState] = useState({
    field: "",
    mode: "date" as "date" | "time",
    isVisible: false,
  })

  const participants =
    getCalendarRecent &&
    getCalendarRecent.filter((email) => email !== authMe?.email)

  const initialValues: IFormValues = {
    title: eventDetailsData?.title || "",
    date:
      moment(eventDetailsData?.startDate).format("YYYY-MM-DD") ||
      currentDate.format("YYYY-MM-DD"),
    startDate: eventDetailsData?.startDate
      ? moment(eventDetailsData?.startDate).format("HH:mm")
      : "",
    endDate: eventDetailsData?.endDate
      ? moment(eventDetailsData?.endDate).format("HH:mm")
      : "",
    timezone: eventDetailsData?.gmtDelta.toString() || "",
    participants: participants || [],
    color: eventDetailsData?.color || "",
    description: eventDetailsData?.description || "",
  }

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

  const handleDateConfirm = (date: Date) => {
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

  const handleSubmitForm = async (values: IFormValues) => {
    try {
      const payload = {
        ...values,
        startDate: moment(
          `${values.date} ${values.startDate}`,
          "YYYY-MM-DD HH:mm"
        )
          .utcOffset(-values.timezone) // Adjust based on the timezone offset
          .toISOString(),
        endDate: moment(`${values.date} ${values.endDate}`, "YYYY-MM-DD HH:mm")
          .utcOffset(-values.timezone) // Adjust based on the timezone offset
          .toISOString(),
        gmtDelta: Number(values.timezone),
      }

      let res
      if (isEditMode) {
        res = await updateEvent({ ...payload, id: eventId }).unwrap()
        eventDetailsRefetch()
      } else {
        res = await createEvent(payload).unwrap()
      }

      if (res) {
        Toast.show({
          type: "success",
          text1: t(isEditMode ? "DetailsUpdated!" : "MeetingScheduled!"),
        })
        !!refetch && refetch()
        formikRef.current?.resetForm()
        onClose()
        navigate(ScreensEnum.CALENDAR)
      }
    } catch (error) {
      console.error(isEditMode ? "updateEventError" : "createEventError", error)
    }
  }

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        height={screenHeight * 0.92}
        backdropMaskColor={colors.blackOpacity08}
        style={styles.bottomSheet}
        disableBodyPanning
        disableKeyboardHandling
      >
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
                  {isEditMode && (
                    <Icon name={"backArrow"} onPress={handleGoModalBack} />
                  )}
                  <Text style={styles.title}>
                    {isEditMode ? t("EditDetails") : t("ScheduleMeeting")}
                  </Text>
                </View>
                <Icon name={"closeButton"} onPress={onClose} />
              </View>
              {!isEditMode && (
                <Text style={styles.subtitle}>{t("ScheduleTheMeeting")}</Text>
              )}
            </View>

            <Formik
              enableReinitialize
              innerRef={formikRef}
              initialValues={initialValues}
              validationSchema={validationCreateEventSchema}
              onSubmit={handleSubmitForm}
            >
              {({
                isValid,
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
                            inputType="dropdown"
                            label="Time Start"
                            placeholder="Select start time"
                            required
                            value={values.startDate}
                            onChangeText={() => {}}
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
                            inputType="dropdown"
                            label="Time End"
                            placeholder="Select end time"
                            required
                            editable={false}
                            value={values.endDate}
                            onChangeText={() => {}}
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
                              ? errors.participants.join("")
                              : String(errors.participants)
                            : undefined
                        }
                        onFocus={() => setIsMenuOpen(true)}
                        onBlur={() => setIsMenuOpen(false)}
                      />
                      {isMenuOpen && (
                        <View style={{ position: "relative" }}>
                          <View style={styles.menuContainer}>
                            {participants &&
                              participants.map((email, idx) => {
                                return (
                                  <TouchableOpacity
                                    onPress={() => {
                                      setFieldValue(
                                        "participants",
                                        values.participants.includes(email)
                                          ? values.participants.filter(
                                              (participant) =>
                                                participant !== email
                                            )
                                          : [...values.participants, email]
                                      )
                                    }}
                                    key={idx}
                                    style={styles.menuItem}
                                  >
                                    {values.participants.includes(email) && (
                                      <Icon name="successCheck" />
                                    )}
                                    <Text style={styles.subtitle}>{email}</Text>
                                  </TouchableOpacity>
                                )
                              })}
                          </View>
                        </View>
                      )}
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
                        disabled={!isValid}
                        type="primary"
                        text={isEditMode ? t("Edit") : t("Schedule")}
                        isLoading={isCreateEventLoading || isUpdateEventLoading}
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
      </BottomSheet>
      <DateTimePickerModal
        pickerStyleIOS={helpers.flexCenter}
        date={defaultTime()}
        isVisible={datePickerState.isVisible}
        mode={datePickerState.mode}
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
        display={datePickerState.mode === "date" ? "inline" : undefined}
        is24Hour={false}
        minuteInterval={10}
        minimumDate={
          datePickerState.mode === "date" ? moment().toDate() : undefined
        }
      />
    </>
  )
}

export default ScheduleMeetingModal
