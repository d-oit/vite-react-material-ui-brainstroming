import { ReactNode } from 'react';
import { ReactFlowProvider } from 'reactflow';

interface ReactFlowWrapperProps {
  children: ReactNode;
}

export const ReactFlowWrapper = ({ children }: ReactFlowWrapperProps) => {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
};
