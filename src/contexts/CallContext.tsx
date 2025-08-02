import React, { createContext, useContext, useState } from 'react';
import { CallType } from '@/lib/CallService';
import CallManager from '@/components/CallManager';

interface CallContextType {
  initiateCall: (receiverId: string, callType?: CallType) => Promise<void>;
  showCallHistory: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Call initiation function that will be implemented by the CallManager
  const initiateCall = async (receiverId: string, callType: CallType = 'audio') => {
    // This is a placeholder that will be overridden by the CallManager component
    console.log('Call initiation not yet implemented');
  };

  // Show call history function that will be implemented by the CallManager
  const showCallHistory = () => {
    // This is a placeholder that will be overridden by the CallManager component
    console.log('Show call history not yet implemented');
  };

  // Create a ref that will be used to store the actual call functions
  const callRef = React.useRef<CallContextType>({
    initiateCall,
    showCallHistory
  });

  // Function to update the call functions with the actual implementations from CallManager
  const updateCallFunctions = (
    initiateFn: (receiverId: string, callType?: CallType) => Promise<void>,
    historyFn: () => void
  ) => {
    callRef.current = {
      initiateCall: initiateFn,
      showCallHistory: historyFn
    };
  };

  return (
    <CallContext.Provider value={callRef.current}>
      <CallManagerWithContext updateCallFunctions={updateCallFunctions}>
        {children}
      </CallManagerWithContext>
    </CallContext.Provider>
  );
};

// Wrapper component for CallManager that updates the call functions
interface CallManagerWithContextProps {
  children: React.ReactNode;
  updateCallFunctions: (
    initiateFn: (receiverId: string, callType?: CallType) => Promise<void>,
    historyFn: () => void
  ) => void;
}

const CallManagerWithContext: React.FC<CallManagerWithContextProps> = ({
  children,
  updateCallFunctions
}) => {
  // State to track call and history dialog visibility
  const [currentCallerId, setCurrentCallerId] = useState<string | null>(null);
  const [currentCallType, setCurrentCallType] = useState<CallType>('audio');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Function to handle call initiation
  const handleInitiateCall = async (receiverId: string, callType: CallType = 'audio') => {
    setCurrentCallerId(receiverId);
    setCurrentCallType(callType);
  };
  
  // Function to show call history
  const handleShowCallHistory = () => {
    setIsHistoryOpen(true);
  };
  
  // Update the context functions when component mounts
  React.useEffect(() => {
    updateCallFunctions(handleInitiateCall, handleShowCallHistory);
  }, [updateCallFunctions]);
  
  return (
    <CallManager>
      {children}
    </CallManager>
  );
};

export default CallProvider; 