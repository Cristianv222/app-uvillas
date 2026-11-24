import { PredictiveArcCanvas } from '@designcodeio/threeui/components/PredictiveArcCanvas';

export default function Arc() {
  // hue 38 = amber dorado uvilla, saturation 0.6 para riqueza cálida
  return (
    <PredictiveArcCanvas
      mode="dark"
      speed={0.28}
      hue={38}
      saturation={0.6}
    />
  );
}
