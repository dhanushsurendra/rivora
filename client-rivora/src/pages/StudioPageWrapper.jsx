import { HMSRoomProvider } from '@100mslive/react-sdk';
import StudioPage from './StudioPage';

const StudioPageWrapper = () => {
  return (
    <HMSRoomProvider>
      <StudioPage />
    </HMSRoomProvider>
  );
};

export default StudioPageWrapper;
