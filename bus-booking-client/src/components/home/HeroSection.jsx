import SearchForm from './SearchForm';

export default function HeroSection() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-white to-secondary sm:px-0 px-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-8">
              Get Your Ticket Online,
              <br />
              Easy and Safely
            </h2>
            <button className="bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-primary/90 transition">
              GET TICKET NOW
            </button>
          </div>

          <div>
            <SearchForm />
          </div>
        </div>
      </div>
    </div>
  );
}
