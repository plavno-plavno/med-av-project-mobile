import React, { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity } from "react-native"
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
import BottomSheet from "@devvie/bottom-sheet"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import colors from "src/assets/colors"

interface IFormValues {
  date: string
  title: string
  timezone: string
  timeStart: string
  timeEnd: string
  inviteParticipants: string[]
  color: string
  description: string
}

const ScheduleMeetingModal = ({ onClose, sheetRef }: any) => {
  const { t } = useTranslation()
  const { currentDate } = useAppSelector((state) => state.calendar)

  const formikRef = React.useRef<FormikProps<IFormValues>>(null as any)

  const [datePickerState, setDatePickerState] = useState({
    field: "",
    mode: "date" as "date" | "time",
    isVisible: false,
  })

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
      timeStart: "HH:mm",
      timeEnd: "HH:mm",
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
    <>
      <BottomSheet
        ref={sheetRef}
        height={screenHeight * 0.92}
        backdropMaskColor={colors.blackOpacity08}
        style={styles.bottomSheet}
        disableBodyPanning
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
                <Icon name={"backArrow"} onPress={onClose} />
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
              timeStart: "",
              timeEnd: "",
              inviteParticipants: [],
              color: "",
              description: "",
            }}
            validationSchema={validationCreateEventSchema}
            onSubmit={(values) => {
              console.log(values, "values123")
            }}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              values,
              errors,
              touched,
            }) => {
              console.log(values, "values")

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
                      dropdownData={[
                        {
                          value: "(GMT+2:00) Warsaw",
                          label: "(GMT+2:00) Warsaw",
                        },
                      ]}
                      error={touched.timezone && errors.timezone}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        showDatePicker({ mode: "time", field: "timeStart" })
                      }
                    >
                      <View pointerEvents="none">
                        <CustomInput
                          label="Time Start"
                          placeholder="Select start time"
                          required
                          value={values.timeStart}
                          onChangeText={() => {}}
                          rightIconProps={{
                            name: "downArrow",
                          }}
                          error={touched.timeStart && errors.timeStart}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        showDatePicker({ mode: "time", field: "timeEnd" })
                      }
                    >
                      <View pointerEvents="none">
                        <CustomInput
                          label="Time End"
                          placeholder="Select end time"
                          required
                          editable={false}
                          value={values.timeEnd}
                          onChangeText={() => {}}
                          rightIconProps={{
                            name: "downArrow",
                          }}
                          error={touched.timeEnd && errors.timeEnd}
                        />
                      </View>
                    </TouchableOpacity>

                    <CustomInput
                      inputType="chip"
                      label="Invite Participants"
                      required
                      placeholder="Invite participants"
                      value={values.inviteParticipants}
                      onChangeText={(val) =>
                        setFieldValue("inviteParticipants", val)
                      }
                      error={
                        touched.inviteParticipants && errors.inviteParticipants
                          ? Array.isArray(errors.inviteParticipants)
                            ? errors.inviteParticipants.join(", ")
                            : String(errors.inviteParticipants)
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
                      onPress={handleSubmit}
                      style={[helpers.width100Percent, helpers.mb24]}
                    />
                  </View>
                </ScrollView>
              )
            }}
          </Formik>
        </View>
      </BottomSheet>

      <DateTimePickerModal
        pickerStyleIOS={{
          justifyContent: "center",
          alignItems: "center",
        }}
        isVisible={datePickerState.isVisible}
        mode={datePickerState.mode}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        display={datePickerState.mode === "date" ? "inline" : undefined}
        is24Hour={false}
        minuteInterval={10}
      />
    </>
  )
}

export default ScheduleMeetingModal
