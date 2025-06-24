import Navigation from "@/components/Navigation";

export default function AboutUs() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">About Us</h1>
        <section className="bg-white rounded-xl shadow p-6 w-full max-w-3xl flex flex-col gap-8 mb-12">
          <div>
            <h2 className="text-xl font-semibold mb-2">Company Introduction</h2>
            <div className="text-gray-600 min-h-[60px] italic">(Company introduction will be added soon.)</div>
          </div>
        </section>
      </main>
    </div>
  );
} 