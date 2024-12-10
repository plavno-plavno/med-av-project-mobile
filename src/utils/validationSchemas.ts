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