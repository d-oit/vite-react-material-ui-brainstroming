import React from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface FormattedMessageProps {
  id: string;
  defaultMessage: string;
  values?: Record<string, string | number | boolean | null | undefined>;
  html?: boolean;
}

/**
 * A component that formats internationalized messages with variable substitution.
 *
 * @param id - The translation key
 * @param defaultMessage - The default message to use if the translation is not found
 * @param values - Values to substitute into the message
 * @param html - Whether to render the message as HTML (use with caution)
 */
export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  id,
  defaultMessage,
  values = {},
  html = false,
}) => {
  const { t } = useI18n();

  // Get the translated message
  const message = t(id) || defaultMessage;

  // Replace placeholders with values
  const formattedMessage = Object.entries(values).reduce((msg, [key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    return msg.replace(regex, String(value ?? ''));
  }, message);

  // Render as HTML or plain text
  if (html) {
    return <span dangerouslySetInnerHTML={{ __html: formattedMessage }} />;
  }

  return <>{formattedMessage}</>;
};

export default FormattedMessage;
