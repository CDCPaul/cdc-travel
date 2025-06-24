"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";

const products = [
  {
    id: "1",
    title: "Gyeongju + Busan All Inclusive",
    price: "₱40,888",
    childPrice: "₱34,888",
    date: "AUG 21-24, 2025",
    description: "4 days, 3 nights. Departure from Cebu. 4 star Hotel in Gyeongju / Busan.",
    image: "/images/AUG_CEB-PUS_AGT_Leaflet.jpg",
    details: [
      "Arrival, Yangdong Village, Daereungwon Tomb Complex, Hwangridan-gil, Woljeonggyo Bridge, Donggung Palace & Wolji pond",
      "Bulguksa Temple, Seokguram Buddha Statue, Gamcheon Culture Village, Busan Tower, BIFF Square & Nampodong",
      "Ginseng & Cosmetic Shop, Haedong Yonggungsa Temple, Blueline park Sky Capsule, Haeundae Beach & Market",
      "Red Pine Shop, Local Supermarket, Taejongdae (Danubi Train), Duty Free Shop, Transfer to Airport"
    ]
  },
  {
    id: "2",
    title: "Seoul All Inclusive",
    price: "₱48,888",
    childPrice: "₱40,888",
    date: "AUG 21-24, 2025",
    description: "4 days, 3 nights. Departure from Cebu. 4 star Hotel in MyeongDong.",
    image: "/images/AUG_CEB-ICN_AGT_Leaflet.jpg",
    details: [
      "Gangchon Rail Bike, Nami Island, Han river Cruise",
      "Pocheon Art valley + Monorail, Alpaca World, N Seoul Tower",
      "EVERLAND Themepark (with 1day pass), Ginseng Museum, Cosmetic Gallery, Starfield Library Coex",
      "Red Pine Shop, Amethyst Shop, Gyeongbok Palace (With hanbok wearing), Bukchon Hanok Village, Local Supermarket for snacks and Souvenirs"
    ]
  }
];

export default function TourDetailPage() {
  const params = useParams();
  const product = products.find((p) => p.id === params.id);
  if (!product) return <div className="pt-32 text-center">Product not found.</div>;

  return (
    <div className="min-h-screen">
      <Navigation />
      <main
        className="bg-gray-50 flex flex-col items-center pt-28 px-4"
      >
        <section
          className="bg-white rounded-xl shadow p-6 w-full max-w-3xl flex flex-col gap-6"
        >
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          {product.image && product.image !== "" ? (
            <Image src={product.image} alt={product.title} width={600} height={400} className="rounded mb-4 object-cover" />
          ) : null}
          <div className="text-lg mb-1">{product.date}</div>
          <div className="text-xl font-bold text-teal-700 mb-2">{product.price} <span className="text-base font-normal text-gray-500">(Child {product.childPrice})</span></div>
          <p className="mb-2 text-gray-700">{product.description}</p>
          <ul className="list-disc list-inside text-gray-600 text-sm mb-2">
            {product.details.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </section>
      </main>
    </div>
  );
} 