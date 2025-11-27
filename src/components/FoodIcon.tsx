import CabbageSvg from '../../icon/cabbage-svgrepo-com.svg';
import CarrotSvg from '../../icon/carrot-svgrepo-com.svg';
import CrabSvg from '../../icon/crab-svgrepo-com.svg';
import EggplantSvg from '../../icon/eggplant-svgrepo-com.svg';
import ElbowSvg from '../../icon/elbow-svgrepo-com.svg';
import TomatoSvg from '../../icon/tomato-svgrepo-com.svg';

interface FoodIconProps {
  type: 'cabbage' | 'carrot' | 'crab' | 'eggplant' | 'elbow' | 'tomato';
}

export default function FoodIcon({ type }: FoodIconProps) {
  const iconMap = {
    cabbage: CabbageSvg,
    carrot: CarrotSvg,
    crab: CrabSvg,
    eggplant: EggplantSvg,
    elbow: ElbowSvg,
    tomato: TomatoSvg,
  };

  const iconSrc = iconMap[type];

  return (
    <div className="w-12 h-12">
      <img src={iconSrc} alt={type} className="w-full h-full object-contain" />
    </div>
  );
}
