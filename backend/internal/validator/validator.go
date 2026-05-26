package validator

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"regexp"
	"strings"
	"unicode"
)

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ValidationErrors struct {
	Errors []ValidationError `json:"errors"`
}

func (v ValidationErrors) Error() string {
	parts := make([]string, len(v.Errors))
	for i, e := range v.Errors {
		parts[i] = fmt.Sprintf("%s: %s", e.Field, e.Message)
	}
	return strings.Join(parts, "; ")
}

func (v *ValidationErrors) Add(field, message string) {
	v.Errors = append(v.Errors, ValidationError{Field: field, Message: message})
}

func (v ValidationErrors) HasErrors() bool {
	return len(v.Errors) > 0
}

var turkishPlateRe = regexp.MustCompile(`^\d{2}\s?[A-Z]{1,3}\s?\d{2,5}$`)
var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func Validate(obj interface{}) error {
	val := reflect.ValueOf(obj)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	if val.Kind() != reflect.Struct {
		return nil
	}

	typ := val.Type()
	verr := ValidationErrors{}

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		tag := field.Tag.Get("validate")
		if tag == "" {
			continue
		}

		fieldVal := val.Field(i)
		fieldName := jsonFieldName(field)

		rules := strings.Split(tag, ",")
		for _, rule := range rules {
			rule = strings.TrimSpace(rule)

			switch {
			case rule == "required":
				if isZero(fieldVal) {
					verr.Add(fieldName, "is required")
				}
			case rule == "email":
				if !fieldVal.IsZero() {
					if str, ok := fieldVal.Interface().(string); ok && !IsValidEmail(str) {
						verr.Add(fieldName, "must be a valid email address")
					}
				}
			case rule == "plaka":
				if !fieldVal.IsZero() {
					if str, ok := fieldVal.Interface().(string); ok && !IsValidTurkishPlate(str) {
						verr.Add(fieldName, "must be a valid Turkish license plate")
					}
				}
			}
		}
	}

	if verr.HasErrors() {
		return verr
	}
	return nil
}

func jsonFieldName(field reflect.StructField) string {
	tag := field.Tag.Get("json")
	if tag == "" || tag == "-" {
		return field.Name
	}
	parts := strings.Split(tag, ",")
	if parts[0] == "" {
		return field.Name
	}
	return parts[0]
}

func isZero(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.String:
		return v.String() == ""
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return v.Int() == 0
	case reflect.Float32, reflect.Float64:
		return v.Float() == 0
	case reflect.Bool:
		return !v.Bool()
	case reflect.Ptr, reflect.Interface, reflect.Slice, reflect.Map:
		return v.IsNil()
	default:
		return false
	}
}

func IsValidEmail(email string) bool {
	return emailRe.MatchString(email)
}

func IsValidTurkishPlate(plaka string) bool {
	return turkishPlateRe.MatchString(plaka)
}

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("Şifre en az 8 karakter olmalıdır")
	}

	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		case unicode.IsPunct(ch) || unicode.IsSymbol(ch):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return fmt.Errorf("Şifre en az bir büyük harf içermelidir")
	}
	if !hasLower {
		return fmt.Errorf("Şifre en az bir küçük harf içermelidir")
	}
	if !hasDigit {
		return fmt.Errorf("Şifre en az bir rakam içermelidir")
	}
	if !hasSpecial {
		return fmt.Errorf("Şifre en az bir özel karakter içermelidir (!@#$ vb.)")
	}

	return nil
}

func WriteValidationError(w http.ResponseWriter, err error) {
	var verr ValidationErrors
	if ve, ok := err.(ValidationErrors); ok {
		verr = ve
	} else {
		verr = ValidationErrors{
			Errors: []ValidationError{
				{Field: "body", Message: err.Error()},
			},
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnprocessableEntity)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"errors":  verr.Errors,
	})
}
