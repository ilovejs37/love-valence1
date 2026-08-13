import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Step1SelfProfile } from './components/Step1SelfProfile';
import { Step2IdealProfile } from './components/Step2IdealProfile';
import { Step3Auction } from './components/Step3Auction';
import { Step4DatingGame } from './components/Step4DatingGame';
import { Step5SimulationLoading } from './components/Step5SimulationLoading';
import { Step6ResultReport } from './components/Step6ResultReport';

import {
  SelfProfile,
  IdealProfile,
  DimensionsWeights,
  LoveMatchTestResult,
} from './types';
import { generateCandidatePool } from './data/mockCandidates';
import { runLoveMatchTest } from './utils/matchingAlgorithm';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);

  // State data collected through steps
  const [selfProfile, setSelfProfile] = useState<SelfProfile | null>(null);
  const [idealProfile, setIdealProfile] = useState<IdealProfile | null>(null);
  const [explicitWeight, setExplicitWeight] = useState<DimensionsWeights | null>(null);
  const [implicitWeight, setImplicitWeight] = useState<DimensionsWeights | null>(null);
  const [testResult, setTestResult] = useState<LoveMatchTestResult | null>(null);

  // Determine opposite gender for matching candidates
  const targetCandidateGender = selfProfile?.gender === '남성' ? '여성' : (selfProfile?.gender === '여성' ? '남성' : undefined);

  // Generate candidate pool matching opposite gender
  const candidatePool = useMemo(() => {
    return generateCandidatePool(150, targetCandidateGender);
  }, [targetCandidateGender]);

  const handleStep1Complete = (profile: SelfProfile) => {
    setSelfProfile(profile);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Complete = (ideal: IdealProfile) => {
    setIdealProfile(ideal);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep3Complete = (explicit: DimensionsWeights) => {
    setExplicitWeight(explicit);
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep4Complete = (implicit: DimensionsWeights) => {
    setImplicitWeight(implicit);
    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep5SimulationComplete = () => {
    if (selfProfile && idealProfile && explicitWeight && implicitWeight) {
      const result = runLoveMatchTest(
        selfProfile,
        idealProfile,
        explicitWeight,
        implicitWeight,
        candidatePool
      );
      setTestResult(result);
    }
    setCurrentStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSelfProfile(null);
    setIdealProfile(null);
    setExplicitWeight(null);
    setImplicitWeight(null);
    setTestResult(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-rose-500 selection:text-white">
      <Header currentStep={currentStep} totalSteps={6} onReset={handleReset} />

      <main className="pb-16">
        {currentStep === 1 && <Step1SelfProfile onComplete={handleStep1Complete} />}

        {currentStep === 2 && <Step2IdealProfile onComplete={handleStep2Complete} />}

        {currentStep === 3 && <Step3Auction onComplete={handleStep3Complete} />}

        {currentStep === 4 && explicitWeight && (
          <Step4DatingGame
            candidates={candidatePool}
            explicitWeight={explicitWeight}
            onComplete={handleStep4Complete}
          />
        )}

        {currentStep === 5 && (
          <Step5SimulationLoading onComplete={handleStep5SimulationComplete} />
        )}

        {currentStep === 6 && testResult && (
          <Step6ResultReport result={testResult} onRestart={handleReset} />
        )}
      </main>
    </div>
  );
}
