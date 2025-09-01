import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import hapticUtils from '../../utils/hapticUtils';

interface Step {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  validation?: (data: any) => string[];
}

interface MultiStepFormProps {
  steps: Step[];
  initialData?: any;
  onComplete: (data: any) => void;
  onStepChange?: (stepIndex: number) => void;
  showProgress?: boolean;
  allowBackNavigation?: boolean;
  submitButtonText?: string;
  loading?: boolean;
}

const { width } = Dimensions.get('window');

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  initialData = {},
  onComplete,
  onStepChange,
  showProgress = true,
  allowBackNavigation = true,
  submitButtonText = 'Complete',
  loading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [stepData, setStepData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [slideAnim] = useState(new Animated.Value(0));

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = stepData[steps[currentStep]?.id] || {};

  const progress = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100;
  }, [currentStep, steps.length]);

  const canProceed = useMemo(() => {
    const currentStepErrors = errors[steps[currentStep]?.id] || [];
    return currentStepErrors.length === 0;
  }, [errors, currentStep, steps]);

  const handleStepDataChange = useCallback((stepId: string, data: any) => {
    setStepData((prev: { [key: string]: any }) => ({
      ...prev,
      [stepId]: { ...prev[stepId], ...data },
    }));
    setFormData((prev: any) => ({ ...prev, ...data }));
  }, []);

  const validateCurrentStep = useCallback(() => {
    const currentStepValidation = steps[currentStep]?.validation;
    if (!currentStepValidation) return true;

    const validationErrors = currentStepValidation(formData);
    setErrors((prev: { [key: string]: string[] }) => ({
      ...prev,
      [steps[currentStep].id]: validationErrors,
    }));

    return validationErrors.length === 0;
  }, [currentStep, steps, formData]);

  const goToNextStep = useCallback(async () => {
    if (!canProceed) {
      await hapticUtils.validationError();
      return;
    }

    if (isLastStep) {
      await hapticUtils.completion();
      onComplete(formData);
      return;
    }

    await hapticUtils.navigation();
    
    // Slide animation
    Animated.timing(slideAnim, {
      toValue: -(currentStep + 1) * width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    onStepChange?.(nextStep);
  }, [currentStep, isLastStep, canProceed, formData, onComplete, onStepChange, slideAnim]);

  const goToPreviousStep = useCallback(async () => {
    if (isFirstStep || !allowBackNavigation) return;

    await hapticUtils.navigation();
    
    // Slide animation
    Animated.timing(slideAnim, {
      toValue: -(currentStep - 1) * width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const previousStep = currentStep - 1;
    setCurrentStep(previousStep);
    onStepChange?.(previousStep);
  }, [currentStep, isFirstStep, allowBackNavigation, onStepChange, slideAnim]);

  const goToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex === currentStep) return;

    await hapticUtils.navigation();
    
    // Slide animation
    Animated.timing(slideAnim, {
      toValue: -stepIndex * width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  }, [currentStep, onStepChange, slideAnim]);

  const renderProgressBar = () => {
    if (!showProgress) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {steps.length}
        </Text>
      </View>
    );
  };

  const renderStepIndicators = () => {
    if (!showProgress) return null;

    return (
      <View style={styles.stepIndicators}>
        {steps.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.stepIndicator,
              index === currentStep && styles.stepIndicatorActive,
              index < currentStep && styles.stepIndicatorCompleted,
            ]}
            onPress={() => goToStep(index)}
            disabled={!allowBackNavigation || index > currentStep}
          >
            <Text style={[
              styles.stepIndicatorText,
              index === currentStep && styles.stepIndicatorTextActive,
              index < currentStep && styles.stepIndicatorTextCompleted,
            ]}>
              {index < currentStep ? '✓' : index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCurrentStep = () => {
    const CurrentStepComponent = steps[currentStep]?.component;
    if (!CurrentStepComponent) return null;

    return (
      <CurrentStepComponent
        data={currentStepData}
        onChange={(data: any) => handleStepDataChange(steps[currentStep].id, data)}
        errors={errors[steps[currentStep].id] || []}
        onValidate={validateCurrentStep}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderProgressBar()}
      {renderStepIndicators()}
      
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{steps[currentStep]?.title}</Text>
        <Text style={styles.stepDescription}>{steps[currentStep]?.description}</Text>
        
        <ScrollView
          style={styles.stepScrollView}
          contentContainerStyle={styles.stepScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>
      </View>

      <View style={styles.navigationContainer}>
        {!isFirstStep && allowBackNavigation && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={goToPreviousStep}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
            isLastStep && styles.submitButton,
          ]}
          onPress={goToNextStep}
          disabled={!canProceed || loading}
        >
          <LinearGradient
            colors={isLastStep ? ['#4CAF50', '#45A049'] : ['#2196F3', '#1976D2']}
            style={styles.buttonGradient}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Loading...' : isLastStep ? submitButtonText : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stepIndicatorActive: {
    backgroundColor: Colors.light.tint,
  },
  stepIndicatorCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  stepIndicatorTextActive: {
    color: '#fff',
  },
  stepIndicatorTextCompleted: {
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingBottom: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 2,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  submitButton: {
    flex: 2,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MultiStepForm;
