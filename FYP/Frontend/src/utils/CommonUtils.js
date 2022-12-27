import moment from "moment"

const dateFormat = (dateString) => {
  try {
    let x = moment(dateString)
    if (x.isValid()) {
      return x.format("D MMM YYYY")
    }
    return "-"
  } catch (error) {
    return "-"
  }
}

const dateFormatWithTime = (dateString) => {
  try {
    let x = moment(dateString)
    if (x.isValid()) {
      return x.format("D MMM YYYY, h:mm:ss a")
    }
    return "-"
  } catch (error) {
    return "-"
  }
}

const dateFormatForInputField = (dateString) => {
  try {
    let x = moment(dateString)
    if (x.isValid()) {
      return x.format("YYYY-MM-DD")
    }
    return ""
  } catch (error) {
    return ""
  }
}

const fileSizeFormat = (size) => {
  if (size >= 1000000) {
    return `${(size / 1000000).toFixed(2)} MB`
  }

  if (size >= 1000) {
    return `${(size / 1000).toFixed(2)} KB`
  }

  return `${size.toFixed(2)} B`
}

export { dateFormat, dateFormatForInputField, fileSizeFormat, dateFormatWithTime }