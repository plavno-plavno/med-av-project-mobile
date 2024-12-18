import React, { useState } from "react"
import { View, Text, Modal, ScrollView } from "react-native"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import { Formik, FormikProps } from "formik"
import CustomInput from "src/components/CustomInput"
import moment from "moment-timezone"
import { Icon, CustomButton } from "@components"
import DatePicker from "react-native-neat-date-picker"

import { styles } from "./styles"
import { useAppSelector } from "src/hooks/redux"
import { validationCreateEventSchema } from "@utils/validationSchemas"

const mockTimeRange = [
  {
    label: "4:00 AM",
    value: "4:00 AM",
  },
  {
    label: "4:30 AM",
    value: "4:30 AM",
  },
]
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

const ScheduleMeetingModal = ({ isVisible, onClose }: any) => {
  const { t } = useTranslation()
  const { currentDate } = useAppSelector((state) => state.calendar)
  const formikRef = React.useRef<FormikProps<IFormValues>>(null as any)

  const [showDatePickerSingle, setShowDatePickerSingle] = useState(false)

  const openDatePickerSingle = () => setShowDatePickerSingle(true)

  const onCancelSingle = () => {
    setShowDatePickerSingle(false)
  }

  const onConfirmSingle = (output: any) => {
    const { setFieldValue } = formikRef.current
    setShowDatePickerSingle(false)
    setFieldValue("date", output.dateString)
  }

  const timezones = moment.tz
    .names()
    .map((timezone) => {
      const offset = moment.tz(timezone).format("Z") // Get the timezone offset
      return {
        label: `(${offset}) ${timezone.replace("_", " ")}`,
        value: timezone,
        offset, // Adding offset for filtering
      }
    })
    .filter((tz) => tz.label.includes("GMT")) // Filter only GMT zones

  return (
    <>
      <Modal transparent={true} animationType="slide" visible={isVisible}>
        <View style={styles.modalContainer}>
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
            <DatePicker
              isVisible={showDatePickerSingle}
              mode={"single"}
              onCancel={onCancelSingle}
              onConfirm={onConfirmSingle}
            />

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
                          onPress: openDatePickerSingle,
                        }}
                        error={touched.date && errors.date}
                      />

                      <CustomInput
                        inputType="dropdown"
                        required
                        label="Timezone"
                        editable={false}
                        value={values.timezone}
                        onChangeText={(val) =>
                          handleChange("timezone")(val as string)
                        }
                        dropdownData={timezones}
                        error={touched.timezone && errors.timezone}
                      />
                      <CustomInput
                        label="Time Start"
                        inputType="dropdown"
                        required
                        editable={false}
                        value={values.timeStart}
                        onChangeText={(val) =>
                          handleChange("timeStart")(val as string)
                        }
                        dropdownData={mockTimeRange}
                        error={touched.timeStart && errors.timeStart}
                      />
                      <CustomInput
                        label="Time End"
                        inputType="dropdown"
                        required
                        editable={false}
                        value={values.timeEnd}
                        onChangeText={(val) =>
                          handleChange("timeEnd")(val as string)
                        }
                        dropdownData={mockTimeRange}
                        error={touched.timeEnd && errors.timeEnd}
                      />
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
                          touched.inviteParticipants &&
                          errors.inviteParticipants
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
                        style={helpers.width100Percent}
                      />
                    </View>
                  </ScrollView>
                )
              }}
            </Formik>
          </View>
        </View>
      </Modal>
    </>
  )
}

export default ScheduleMeetingModal
