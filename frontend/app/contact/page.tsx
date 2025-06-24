import Navigation from "@/components/Navigation";

export default function Contact() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="bg-gray-50 flex flex-col items-center pt-28 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>
        <section className="w-full max-w-2xl flex flex-col items-center">
          <p className="mb-4 text-gray-700 text-center">For inquiries, please contact us via email or messenger.</p>
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <a
              href="mailto:outbound@cebudirectclub.com"
              className="bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-800 transition text-center"
            >
              Email Us
            </a>
            <a
              href="https://open.kakao.com/o/gPh3aNjh"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition text-center"
            >
              KakaoTalk
            </a>
            <a
              href="viber://chat?number=%2B639778237107"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition text-center"
            >
              Viber
            </a>
            <a
              href="https://www.facebook.com/cdctravel"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center"
            >
              Facebook Messenger
            </a>
          </div>
          <div className="w-full bg-white rounded-xl shadow p-6 flex flex-col gap-6">
            <h2 className="text-xl font-semibold mb-2">How to Find Us</h2>
            <div className="text-gray-700 mb-4">
              UNIT 09-11, PHASE 2 GAISANO MACTAN ISLAND MALL,<br />
              M.L. QUEZON NATIONAL HIGHWAY, PAJO,<br />
              LAPU LAPU CITY, CEBU 6015
            </div>
            <div className="w-full h-[350px] rounded overflow-hidden">
              <iframe
                title="Google Map"
                src="https://www.google.com/maps?q=GAISANO+MACTAN+ISLAND+MALL,+M.L.+QUEZON+NATIONAL+HIGHWAY,+PAJO,+LAPU+LAPU+CITY,+CEBU+6015&output=embed"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 