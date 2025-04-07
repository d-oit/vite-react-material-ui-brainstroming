import { Save as SaveIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { memo } from 'react';
import { Controls, ControlButton } from 'reactflow';

interface FlowControlsProps {
  onSave?: () => void;
  readOnly?: boolean;
}

const FlowControls = memo(({ onSave, readOnly }: FlowControlsProps) => {
  const theme = useTheme();

  return (
    <Controls
      style={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
      }}
      showZoom={true}
      showFitView={true}
      showInteractive={!readOnly}
      position="bottom-right"
    >
      {!readOnly && onSave && (
        <ControlButton onClick={onSave} title="Save changes">
          <SaveIcon />
        </ControlButton>
      )}
    </Controls>
  );
});

FlowControls.displayName = 'FlowControls';

export default FlowControls;
