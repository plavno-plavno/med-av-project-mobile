import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Keyboard,
} from "react-native"
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
  useGetCalendarTimezonesQuery,
  useUpdateEventMutation,
} from "src/api/calendarApi/calendarApi"
import Toast from "react-native-toast-message"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { navigate } from "src/navigation/RootNavigation"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { styles } from "./styles"
import colors from "src/assets/colors"
import { useAuthMeQuery } from "src/api/userApi/userApi"
import { DateTimeFormatEnum } from "@utils/enums"
import { timeRounder } from "@utils/utils"
import { ITimezone } from "src/api/calendarApi/types"
import { useTimezoneQuery } from "src/api/auth/authApi"

interface IFormValues {
  date: string
  title: string
  timezone: string | number
  startDate: string
  endDate: string
  participants: string[]
  color: string
  description: string
}

const DEFAULT_COLOR = colors.lightAqua

interface IScheduleMeetingModal {
  onClose: () => void
  handleEventTime?: string
  handleGoModalBack?: () => void
  sheetRef: React.RefObject<BottomSheetMethods>
  eventId?: number
  refetch?: () => void
  scrollRef: React.RefObject<KeyboardAwareScrollView>
}

interface IDatePickerState {
  field: string
  mode: "date" | "time"
  isVisible: boolean
  initialDate: string
}

const ScheduleMeetingModal = ({
  onClose,
  sheetRef,
  handleEventTime,
  eventId,
  handleGoModalBack,
  refetch,
  scrollRef,
}: IScheduleMeetingModal) => {
  const { t } = useTranslation()
  const { currentDate } = useAppSelector((state) => state.calendar)
  const formikRef = React.useRef<FormikProps<IFormValues>>(null as any)
  const isEditMode = !!eventId

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [createEvent, { isLoading: isCreateEventLoading }] =
    useCreateEventMutation()

  const { data: timezone } = useTimezoneQuery()
  const { data: timezones } = useGetCalendarTimezonesQuery({
    page: "1",
    limit: "100",
    term: "",
  })
  const timezoneOptions = timezones?.data?.map((item: ITimezone) => ({
    label: item.text,
    value: item.id.toString(),
  }))

  const { data: eventDetailsData, refetch: eventDetailsRefetch } =
    useGetCalendarEventDetailsQuery({ id: eventId || 0 }, { skip: !eventId })

  const [updateEvent, { isLoading: isUpdateEventLoading }] =
    useUpdateEventMutation()

  const { data: authMe } = useAuthMeQuery()

  const { data: getCalendarRecent } = useGetCalendarRecentQuery()

  const defaultTimeStart = handleEventTime
    ? moment(handleEventTime).format(DateTimeFormatEnum.hhmmA)
    : timeRounder({
        time: moment(eventDetailsData?.startDate),
        roundedTo: 10,
      }).format(DateTimeFormatEnum.hhmmA)

  const defaultTimeEnd = handleEventTime
    ? moment(handleEventTime)
        .add(30, "minutes")
        .format(DateTimeFormatEnum.hhmmA)
    : eventDetailsData?.endDate
    ? moment(eventDetailsData?.endDate).format(DateTimeFormatEnum.hhmmA)
    : moment(defaultTimeStart, DateTimeFormatEnum.hhmmA)
        .add(30, "minutes")
        .format(DateTimeFormatEnum.hhmmA)

  const defaultDate =
    (handleEventTime &&
      moment(handleEventTime).format(DateTimeFormatEnum.DDMMYYYY)) ||
    moment(eventDetailsData?.startDate).format(DateTimeFormatEnum.DDMMYYYY) ||
    currentDate.format(DateTimeFormatEnum.DDMMYYYY)

  const [datePickerState, setDatePickerState] = useState<IDatePickerState>({
    field: "",
    mode: "date" as "date" | "time",
    isVisible: false,
    initialDate: "",
  })

  const recentParticipants =
    getCalendarRecent &&
    getCalendarRecent.filter((email) => email !== authMe?.email)

  const eventParticipants = eventDetailsData?.participants
    .map((participant) => participant.email)
    .filter((email) => email !== authMe?.email)

  const initialValues: IFormValues = {
    title: (eventId && eventDetailsData?.title) || "",
    date: defaultDate,
    startDate: defaultTimeStart,
    endDate: defaultTimeEnd,
    timezone: timezone?.id.toString() || "",
    participants: (eventId && eventParticipants) || [],
    color: (eventId && eventDetailsData?.color) || DEFAULT_COLOR,
    description: (eventId && eventDetailsData?.description) || "",
  }

  const defaultTime = () => {
    const date = new Date()

    if (datePickerState.mode === "date") {
      return date // Return current date if the mode is "date"
    }

    // Default to 8:00 AM if no `startDate` is set
    if (datePickerState.initialDate) {
      const [hours, minutes] = moment(
        datePickerState.initialDate,
        DateTimeFormatEnum.hhmmA
      )
        .format("HH:mm")
        .split(":")
      date.setHours(Number(hours), Number(minutes), 0, 0)
    } else {
      date.setHours(8, 0, 0, 0)
    }

    return date
  }

  const showDatePicker = ({
    mode,
    field,
  }: {
    mode: "date" | "time"
    field: string
  }) => {
    const { values } = formikRef.current as FormikProps<any>

    const initialDate =
      field === "startDate"
        ? values?.startDate || initialValues.startDate
        : values?.endDate || initialValues.endDate

    setDatePickerState({
      field,
      mode,
      isVisible: true,
      initialDate: String(initialDate),
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
      date: DateTimeFormatEnum.DDMMYYYY,
      startDate: DateTimeFormatEnum.hhmmA,
      endDate: DateTimeFormatEnum.hhmmA,
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
      const date = moment(values.date.split("-").reverse().join("-")).format(
        DateTimeFormatEnum.YYYYMMDD
      )
      const payload = {
        ...values,
        startDate:
          date +
          "T" +
          moment(values.startDate, [DateTimeFormatEnum.hhmmA]).format(
            DateTimeFormatEnum.HHmmss
          ),
        endDate:
          date +
          "T" +
          moment(values.endDate, [DateTimeFormatEnum.hhmmA]).format(
            DateTimeFormatEnum.HHmmss
          ),
        timezone: { id: Number(values.timezone) },
      } as const

      const { date: _, ...payloadWithoutDate } = payload

      let res
      if (isEditMode) {
        res = await updateEvent({ ...payloadWithoutDate, id: eventId }).unwrap()
        eventDetailsRefetch()
      } else {
        res = await createEvent(payloadWithoutDate).unwrap()
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

  const onModalClose = () => {
    formikRef.current?.resetForm()
    onClose()
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
          keyboardShouldPersistTaps="always"
          style={[helpers.flexGrow1]}
          ref={scrollRef}
          bounces={false}
          enableOnAndroid
          onScrollBeginDrag={() => {
            Keyboard.dismiss()
          }}
          enableAutomaticScroll
          showsVerticalScrollIndicator={false}
          extraScrollHeight={screenHeight * 0.2}
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
                    <Icon name={"backArrowGray"} onPress={handleGoModalBack} />
                  )}
                  <Text style={styles.title}>
                    {isEditMode ? t("EditDetails") : t("ScheduleMeeting")}
                  </Text>
                </View>
                <Icon name={"closeButton"} onPress={onModalClose} />
              </View>
              {!isEditMode && (
                <Text style={styles.subtitle}>{t("ScheduleTheMeeting")}</Text>
              )}
            </View>

            <Formik
              enableReinitialize
              validateOnChange
              validateOnBlur
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
                    keyboardShouldPersistTaps="always"
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
                        value={String(values.timezone)}
                        onChangeText={(val) =>
                          handleChange("timezone")(val as string)
                        }
                        dropdownData={timezoneOptions}
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
                            onChangeText={() => {}}
                            rightIconProps={{
                              name: "downArrow",
                            }}
                            error={errors.startDate}
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
                            onChangeText={() => {}}
                            rightIconProps={{
                              name: "downArrow",
                            }}
                            error={errors.endDate}
                          />
                        </View>
                      </TouchableOpacity>
                      <CustomInput
                        inputType="chip"
                        label="Invite Participants"
                        required
                        placeholder="Invite participants"
                        value={values.participants}
                        onChangeText={(val) => {
                          setFieldValue("participants", val)
                        }}
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
                      {isMenuOpen && recentParticipants?.length && (
                        <View style={styles.menuContainer}>
                          <ScrollView keyboardShouldPersistTaps="always">
                            {recentParticipants &&
                              recentParticipants.map((email, idx) => {
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
                          </ScrollView>
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
        buttonTextColorIOS={colors.lightAqua}
        pickerStyleIOS={helpers.flexCenter}
        accentColor={colors.lightAqua}
        date={defaultTime()}
        isVisible={datePickerState.isVisible}
        mode={datePickerState.mode}
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
        locale="en"
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
