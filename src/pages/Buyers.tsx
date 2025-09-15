import { BuyersList } from '@/components/buyers/BuyersList';
import { Navigation } from '@/components/layout/Navigation';

const Buyers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <BuyersList />
    </div>
  );
};

export default Buyers;