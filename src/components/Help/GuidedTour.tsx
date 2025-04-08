import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Flag as FinishIcon,
} from '@mui/icons-material';
import { Box, Button, Paper, Typography, IconButton, useTheme, Fade, Portal } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  spotlightPadding?: number;
  disableOverlay?: boolean;
  disableBeacon?: boolean;
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  showProgress?: boolean;
  showSkip?: boolean;
  showOverlay?: boolean;
  spotlightPadding?: number;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  disableScrolling?: boolean;
  disableOverlayClose?: boolean;
  highlightClass?: string;
  className?: string;
  initialStep?: number;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  showProgress = true,
  showSkip = true,
  showOverlay = true,
  spotlightPadding = 10,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  disableScrolling = false,
  disableOverlayClose = false,
  highlightClass = 'guided-tour-highlight',
  className = '',
  initialStep = 0,
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'right' | 'bottom' | 'left'>(
    'bottom'
  );

  // Get the current step
  const step = steps[currentStep];

  // Find target element
  const findTargetElement = useCallback(() => {
    if (step === undefined || step === null) return null;
    return document.querySelector(step.target) as HTMLElement;
  }, [step]);

  // Calculate tooltip position
  const calculateTooltipPosition = useCallback(() => {
    if (!targetElement || !targetRect) return;

    const placement = step.placement || 'bottom';
    setTooltipPlacement(placement);

    const padding = step.spotlightPadding || spotlightPadding;
    const tooltipWidth = 320; // Fixed tooltip width
    const tooltipHeight = 200; // Estimated tooltip height

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
    }

    // Ensure tooltip is within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 20) left = 20;
    if (left + tooltipWidth > viewportWidth - 20) left = viewportWidth - tooltipWidth - 20;
    if (top < 20) top = 20;
    if (top + tooltipHeight > viewportHeight - 20) top = viewportHeight - tooltipHeight - 20;

    setTooltipPosition({ top, left });
  }, [targetElement, targetRect, step, spotlightPadding]);

  // Scroll target element into view
  const scrollToTarget = useCallback(() => {
    if (!targetElement) return;

    const elementRect = targetElement.getBoundingClientRect();
    const isInViewport =
      elementRect.top >= 0 &&
      elementRect.left >= 0 &&
      elementRect.bottom <= window.innerHeight &&
      elementRect.right <= window.innerWidth;

    if (!isInViewport && !disableScrolling) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [targetElement, disableScrolling]);

  // Update target element and position when step changes
  useEffect(() => {
    if (!isOpen || step === undefined || step === null) return;

    const element = findTargetElement();
    setTargetElement(element);

    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Add highlight class
      element.classList.add(highlightClass);

      // Calculate tooltip position
      calculateTooltipPosition();

      // Scroll to target
      scrollToTarget();

      // Update position on resize
      const handleResize = () => {
        const updatedRect = element.getBoundingClientRect();
        setTargetRect(updatedRect);
        calculateTooltipPosition();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        element.classList.remove(highlightClass);
      };
    }
  }, [
    isOpen,
    step,
    currentStep,
    findTargetElement,
    calculateTooltipPosition,
    scrollToTarget,
    highlightClass,
  ]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose, currentStep]);

  // Handle outside click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && !disableOverlayClose) {
      onClose();
    }
    e.stopPropagation();
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  if (!isOpen || step === undefined || step === null) return null;

  return (
    <Portal>
      {/* Overlay */}
      {showOverlay && (
        <Box
          onClick={handleOverlayClick}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1300,
            pointerEvents: disableOverlayClose ? 'none' : 'auto',
          }}
        />
      )}

      {/* Spotlight */}
      {targetRect && showOverlay && !step.disableOverlay && (
        <Box
          sx={{
            position: 'fixed',
            top: targetRect.top - (step.spotlightPadding || spotlightPadding),
            left: targetRect.left - (step.spotlightPadding || spotlightPadding),
            width: targetRect.width + 2 * (step.spotlightPadding || spotlightPadding),
            height: targetRect.height + 2 * (step.spotlightPadding || spotlightPadding),
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '4px',
            zIndex: 1301,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <Fade in={true}>
        <Paper
          elevation={6}
          className={className}
          sx={{
            position: 'fixed',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: 320,
            maxWidth: '90vw',
            zIndex: 1302,
            borderRadius: 2,
            overflow: 'hidden',
            ...(tooltipPlacement === 'top' && {
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -10,
                left: '50%',
                marginLeft: -10,
                borderWidth: '10px 10px 0',
                borderStyle: 'solid',
                borderColor: `${theme.palette.background.paper} transparent transparent`,
              },
            }),
            ...(tooltipPlacement === 'right' && {
              '&::after': {
                content: '""',
                position: 'absolute',
                left: -10,
                top: '50%',
                marginTop: -10,
                borderWidth: '10px 10px 10px 0',
                borderStyle: 'solid',
                borderColor: `transparent ${theme.palette.background.paper} transparent transparent`,
              },
            }),
            ...(tooltipPlacement === 'bottom' && {
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -10,
                left: '50%',
                marginLeft: -10,
                borderWidth: '0 10px 10px',
                borderStyle: 'solid',
                borderColor: `transparent transparent ${theme.palette.background.paper}`,
              },
            }),
            ...(tooltipPlacement === 'left' && {
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -10,
                top: '50%',
                marginTop: -10,
                borderWidth: '10px 0 10px 10px',
                borderStyle: 'solid',
                borderColor: `transparent transparent transparent ${theme.palette.background.paper}`,
              },
            }),
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {step.title}
            </Typography>
            <IconButton
              size="small"
              onClick={onClose}
              aria-label={t('common.close') || 'Close'}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {step.content}
            </Typography>

            {showProgress && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                {steps.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      mx: 0.5,
                      backgroundColor:
                        index === currentStep
                          ? theme.palette.primary.main
                          : theme.palette.grey[300],
                    }}
                  />
                ))}
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {showSkip && currentStep < steps.length - 1 ? (
                <Button
                  size="small"
                  onClick={handleSkip}
                  color="inherit"
                  sx={{ textTransform: 'none' }}
                >
                  {t('common.skip') || 'Skip'}
                </Button>
              ) : (
                <Box /> // Empty box for spacing
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentStep > 0 && (
                  <Button
                    size="small"
                    onClick={handlePrev}
                    startIcon={<PrevIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('common.back') || 'Back'}
                  </Button>
                )}

                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  endIcon={currentStep === steps.length - 1 ? <FinishIcon /> : <NextIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  {currentStep === steps.length - 1
                    ? t('common.finish') || 'Finish'
                    : t('common.next') || 'Next'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Portal>
  );
};

export default GuidedTour;
