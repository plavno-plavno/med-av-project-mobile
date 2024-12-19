import moment from "moment"
import * as Yup from "yup"

export const validationLoginSchema = Yup.object().shape({
    email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email address is required")
    .trim()
    .test("email-format", "Please enter a valid email address", (value) => {
      if (!value) return false
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
      return emailRegex.test(value)
    }),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
})

export const validationEmailSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email address is required")
    .trim()
    .test("email-format", "Please enter a valid email address", (value) => {
      if (!value) return false
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
      return emailRegex.test(value)
    }),
})

export const validationResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
})

export const validationCreateEventSchema = Yup.object().shape({
  title: Yup.string()
    .required("Title is required")
    .max(100, "Title must be at most 100 characters"),
  
  date: Yup.date()
    .required("Date is required")
    .typeError("Invalid date format"),

  timezone: Yup.string()
    .required("Timezone is required"),

  startDate: Yup.string()
    .required("Start time is required"),

  endDate: Yup.string()
    .required("End time is required")
    .test(
      "is-greater",
      "End time must be after start time",
      function (value) {
        const { startDate } = this.parent;
        if (!startDate || !value) return true;
        return moment(value, "HH:mm").isAfter(moment(startDate, "HH:mm"));
      }
    ),

  participants: Yup.array()
    .of(
      Yup.string()
        .email("Must be a valid email address")
        // .required("Participant email is required")
    )
    .min(1, "At least one participant must be invited"),

  color: Yup.string()
    .required("Color is required"),

  description: Yup.string()
    .max(120, "Description must be at most 120 characters"),
});