export const isRtlText = (text: string = "") => {
  const rtlCharRegex = /[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u08A0-\u08FF]/
  return rtlCharRegex.test(text)
}