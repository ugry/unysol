package email

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
)

var sesClient *ses.Client

func initSES(region string) error {
	if sesClient != nil {
		return nil
	}
	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(region),
	)
	if err != nil {
		return fmt.Errorf("AWS SES yapılandırma hatası: %w", err)
	}
	sesClient = ses.NewFromConfig(cfg)
	return nil
}

func sendViaSES(from, to, subject, body, region string) error {
	if sesClient == nil {
		if err := initSES(region); err != nil {
			return err
		}
	}

	input := &ses.SendEmailInput{
		Source: aws.String(from),
		Destination: &types.Destination{
			ToAddresses: []string{to},
		},
		Message: &types.Message{
			Subject: &types.Content{
				Data:    aws.String(subject),
				Charset: aws.String("UTF-8"),
			},
			Body: &types.Body{
				Html: &types.Content{
					Data:    aws.String(body),
					Charset: aws.String("UTF-8"),
				},
			},
		},
	}

	_, err := sesClient.SendEmail(context.Background(), input)
	if err != nil {
		return fmt.Errorf("SES API gönderim hatası: %w", err)
	}

	return nil
}
