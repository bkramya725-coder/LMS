export const NAME_PATTERN = /^[A-Za-z ]{2,100}$/
export const PHONE_PATTERN = /^[0-9]{10}$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegister(values) {
  const errors = {}
  if (!values.fullName?.trim()) errors.fullName = 'Full name is required'
  else if (!NAME_PATTERN.test(values.fullName.trim())) errors.fullName = 'Name must not contain numbers or special characters'
  if (!values.email?.trim()) errors.email = 'Email is required'
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address'
  if (values.phoneNumber && !PHONE_PATTERN.test(values.phoneNumber)) errors.phoneNumber = 'Phone number must be exactly 10 digits long'
  if (!values.password || values.password.length < 8) errors.password = 'Password must be at least 8 characters'
  if (!values.role) errors.role = 'Select a role'
  return errors
}

export function validateLogin(values) {
  const errors = {}
  if (!values.email?.trim()) errors.email = 'Email is required'
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email address'
  if (!values.password) errors.password = 'Password is required'
  return errors
}

export function validateCourse(values) {
  const errors = {}
  const title = values.title?.trim() || ''
  if (!title) errors.title = 'Course title is required'
  else if (title.length < 5 || title.length > 200) errors.title = 'Course title is required and must be 5-200 characters'
  if (values.price !== '' && values.price !== null && Number(values.price) < 0) errors.price = 'Price cannot be negative'
  return errors
}

export function validateAssessment(values) {
  const errors = {}
  if (!values.title?.trim()) errors.title = 'Assessment title is required'
  if (!values.assessmentType) errors.assessmentType = 'Choose a type'
  if (values.timeLimitMinutes !== '' && Number(values.timeLimitMinutes) <= 0) errors.timeLimitMinutes = 'Time limit must be a positive number of minutes'
  if (values.maxPoints !== '' && Number(values.maxPoints) <= 0) errors.maxPoints = 'Max points must be greater than zero'
  return errors
}

export function validateQuestion(values) {
  const errors = {}
  if (!values.questionText?.trim()) errors.questionText = 'Question text is required'
  if (!values.questionType) errors.questionType = 'Choose a question type'
  if (values.questionType === 'MCQ') {
    const opts = (values.options || '').split('\n').map((o) => o.trim()).filter(Boolean)
    if (opts.length < 2) errors.options = 'Provide at least two options, one per line'
    if (!values.correctAnswer?.trim()) errors.correctAnswer = 'Mark which option is correct'
  }
  if (values.points !== '' && Number(values.points) <= 0) errors.points = 'Points must be greater than zero'
  return errors
}

export function validateGrade(values) {
  const errors = {}
  if (values.score === '' || values.score === null || values.score === undefined) errors.score = 'A score is required'
  else if (Number(values.score) < 0) errors.score = 'Score cannot be negative'
  return errors
}
