import { View, Text, Modal, ScrollView } from "react-native"
import { styles } from "./styles"

import { useTranslation } from "react-i18next"

import { helpers } from "@utils/theme"
import { Formik } from "formik"

import moment from "moment-timezone"
import { Icon, CustomButton } from "@components"
import CustomInput from "src/components/CustomInput"

const ScheduleMeetingModal = ({ isVisible, onClose }: any) => {
  const { t } = useTranslation()

  const timezones = moment.tz.names().map((timezone) => {
    const offset = moment.tz(timezone).format("Z")
    return {
      label: `(${offset}) ${timezone.replace("_", " ")}`,
      value: timezone,
    }
  })

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

  return (
    <Modal transparent={true} animationType="slide" visible={isVisible}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View
              style={[helpers.flexRow, helpers.alignItemsCenter, helpers.gap8]}
            >
              <Icon name={"backArrow"} onPress={onClose} />
              <Text style={styles.title}>{t("ScheduleMeeting")}</Text>
            </View>
            <Icon name={"closeButton"} onPress={onClose} />
          </View>
          <Text style={styles.subtitle}>{t("ScheduleTheMeeting")}</Text>
        </View>

        <Formik
          initialValues={{
            title: "",
            date: "",
            timezone: "",
            timeStart: "",
            timeEnd: "",
            inviteParticipants: ["valery@gmail.com"],
          }}
          // validationSchema={validationResetPasswordSchema}
          onSubmit={() => {}}
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
              <ScrollView style={(helpers.flex1, helpers.width100Percent)}>
                <View style={styles.formContainer}>
                  <CustomInput
                    required
                    label="Title"
                    placeholder={"Enter the title"}
                    value={values.title}
                    onChangeText={(val) => handleChange("title")(val as string)}
                  />
                  <CustomInput
                    required
                    label="Date"
                    editable={false}
                    placeholder={"Pick the date"}
                    value={values.date}
                    onChangeText={(val) => handleChange("date")(val as string)}
                    rightIconProps={{
                      name: "calendarIcon",
                      onPress: () => {},
                    }}
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
                  />
                </View>
              </ScrollView>
            )
          }}
        </Formik>

        <CustomButton
          type="primary"
          text={t("Schedule")}
          onPress={() => {}}
          style={helpers.width100Percent}
        />
      </View>
    </Modal>
  )
}

export default ScheduleMeetingModal
