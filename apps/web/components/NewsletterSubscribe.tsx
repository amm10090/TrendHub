'use client';

import { Button, Input, addToast } from '@heroui/react';
import { IconMailExclamation, IconMailCheck, IconMailCog } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export const NewsletterSubscribe = () => {
  const t = useTranslations('footer.newsletter');
  const toastT = useTranslations('toast.newsletter');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getInputIcon = () => {
    if (email === '') {
      return (
        <IconMailCog
          className="text-text-secondary-light dark:text-text-secondary-dark"
          size={20}
        />
      );
    }
    if (isInvalid) {
      return <IconMailExclamation className="text-danger-500 dark:text-danger-500" size={20} />;
    }

    return <IconMailCheck className="text-success-500 dark:text-success-500" size={20} />;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setIsInvalid(true);
      setErrorMessage(t('invalid_email'));
      addToast({
        title: toastT('please_enter_valid_email.title'),
        description: toastT('please_enter_valid_email.description'),
        icon: <IconMailCog className="w-5 h-5 text-danger-500 dark:text-danger-500" />,
        color: 'danger',
        variant: 'flat',
        radius: 'lg',
        shouldShowTimeoutProgress: true,
        timeout: 3000,
        classNames: {
          base: 'dark:bg-bg-tertiary-dark dark:text-text-primary-dark',
          title: 'dark:text-text-primary-dark font-medium',
          description: 'dark:text-text-secondary-dark mt-1',
          icon: 'dark:text-danger-500',
          closeButton: 'dark:text-text-secondary-dark dark:hover:text-text-primary-dark',
        },
      });

      return;
    }

    setStatus('loading');
    setIsInvalid(false);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error();
      }

      setStatus('success');
      setEmail('');
      addToast({
        title: toastT('subscription_success.title'),
        description: toastT('subscription_success.description'),
        icon: <IconMailCheck className="w-5 h-5 text-success-500 dark:text-success-500" />,
        color: 'success',
        variant: 'flat',
        radius: 'lg',
        shouldShowTimeoutProgress: true,
        timeout: 2000,
        classNames: {
          base: 'dark:bg-bg-tertiary-dark dark:text-text-primary-dark',
          title: 'dark:text-text-primary-dark font-medium',
          description: 'dark:text-text-secondary-dark mt-1',
          icon: 'dark:text-success-500',
          closeButton: 'dark:text-text-secondary-dark dark:hover:text-text-primary-dark',
        },
      });
    } catch {
      setStatus('error');
      addToast({
        title: toastT('subscription_error.title'),
        description: toastT('subscription_error.description'),
        icon: <IconMailExclamation className="w-5 h-5 text-danger-500 dark:text-danger-500" />,
        color: 'danger',
        variant: 'flat',
        radius: 'lg',
        shouldShowTimeoutProgress: true,
        timeout: 3000,
        classNames: {
          base: 'dark:bg-bg-tertiary-dark dark:text-text-primary-dark',
          title: 'dark:text-text-primary-dark font-medium',
          description: 'dark:text-text-secondary-dark mt-1',
          icon: 'dark:text-danger-500',
          closeButton: 'dark:text-text-secondary-dark dark:hover:text-text-primary-dark',
        },
      });
    }
  };

  const handleClear = () => {
    setEmail('');
    setStatus('idle');
    setIsInvalid(false);
    setErrorMessage('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;

    setEmail(newEmail);

    if (newEmail === '') {
      setIsInvalid(false);
      setErrorMessage('');
    } else {
      const isValid = validateEmail(newEmail);

      setIsInvalid(!isValid);
      setErrorMessage(isValid ? '' : t('invalid_email'));
    }
  };

  const handleBlur = () => {
    if (email) {
      const isValid = validateEmail(email);

      setIsInvalid(!isValid);
      setErrorMessage(isValid ? '' : t('invalid_email'));
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider mb-4">
        {t('title')}
      </h3>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
        {t('description')}
      </p>
      <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleSubmit}>
        <Input
          isClearable
          className="flex-1"
          classNames={{
            base: 'bg-bg-tertiary-light dark:bg-bg-tertiary-dark',
            inputWrapper:
              'border-border-primary-light dark:border-border-primary-dark bg-bg-tertiary-light dark:bg-bg-tertiary-dark',
            input:
              'text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark',
            clearButton:
              'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark',
            errorMessage: 'text-danger-500 dark:text-danger-500 text-sm mt-1',
          }}
          color={isInvalid ? 'danger' : 'default'}
          errorMessage={isInvalid && errorMessage}
          isDisabled={status === 'loading'}
          isInvalid={isInvalid}
          placeholder={t('placeholder')}
          radius="md"
          size="lg"
          startContent={getInputIcon()}
          type="email"
          value={email}
          variant="bordered"
          onBlur={handleBlur}
          onChange={handleChange}
          onClear={handleClear}
        />
        <Button
          className="min-w-[120px] bg-text-primary-light dark:bg-text-primary-dark text-bg-primary-light dark:text-bg-primary-dark hover:opacity-90 transition-opacity"
          color="primary"
          isDisabled={status === 'loading' || isInvalid}
          isLoading={status === 'loading'}
          radius="md"
          size="lg"
          type="submit"
          variant="solid"
        >
          {t('subscribe')}
        </Button>
      </form>
    </div>
  );
};
