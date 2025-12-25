export default function FloatingCircles() {
  return (
    <div className="relative w-64 h-64">
      <div className="absolute w-24 h-24 rounded-full bg-[#ffbb66] blur-lg animate-floating"></div>
      <div
        className="absolute left-12 top-0 w-36 h-36 rounded-full bg-[#ff8866] blur-lg animate-floating"
        style={{ animationDelay: '-800ms' }}
      ></div>
      <div
        className="absolute left-40 top-[-20px] w-8 h-8 rounded-full bg-[#ff2233] blur-lg animate-floating"
        style={{ animationDelay: '-1800ms' }}
      ></div>
    </div>
  );
}
