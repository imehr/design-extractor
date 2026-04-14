import { CircleKHeader } from "@/components/brands/circlek-com/circlek-com-header";
import { CircleKFooter } from "@/components/brands/circlek-com/circlek-com-footer";

const DISCUSSION_OPTIONS = [
  "Please select",
  "Positive Feedback",
  "Promotions & Deals",
  "Mobile App",
  "Carwash",
  "Store-Related Concern",
  "Something Else",
];

export default function CircleKContactPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "'ACT Easy', sans-serif",
        fontSize: 15,
        lineHeight: "24px",
        color: "#141414",
      }}
    >
      <CircleKHeader />

      {/* ─── Page Title ────────────────────────────────────────── */}
      <section className="w-full">
        <div className="mx-auto max-w-[1200px] px-4 pb-8 pt-12">
          <h1
            className="font-black text-black"
            style={{ fontSize: 72, lineHeight: 1.1 }}
          >
            Customer Care
          </h1>
        </div>
      </section>

      {/* ─── Contact Form ──────────────────────────────────────── */}
      <section className="w-full">
        <div className="mx-auto max-w-[1200px] px-4 pb-12">
          <form className="max-w-2xl space-y-6">
            {/* First name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-black">
                First name: <span className="text-[#DA291C]">*</span>
              </label>
              <input
                type="text"
                className="w-full border-b border-gray-400 bg-transparent py-2 text-sm text-[#141414] outline-none transition-colors focus:border-[#DA291C]"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-black">
                Email Address: <span className="text-[#DA291C]">*</span>
              </label>
              <input
                type="email"
                className="w-full border-b border-gray-400 bg-transparent py-2 text-sm text-[#141414] outline-none transition-colors focus:border-[#DA291C]"
              />
            </div>

            {/* Lets Discuss */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-black">
                Lets Discuss:
              </label>
              <select className="w-full border-b border-gray-400 bg-transparent py-2 text-sm text-[#141414] outline-none transition-colors focus:border-[#DA291C]">
                {DISCUSSION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Store address */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-black">
                Store address
              </label>
              <input
                type="text"
                className="w-full border-b border-gray-400 bg-transparent py-2 text-sm text-[#141414] outline-none transition-colors focus:border-[#DA291C]"
              />
            </div>

            {/* Detailed description */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-black">
                Please provide a detailed description of your feedback or
                inquiry.
              </label>
              <textarea
                rows={5}
                className="w-full border-b border-gray-400 bg-transparent py-2 text-sm text-[#141414] outline-none transition-colors focus:border-[#DA291C]"
              />
            </div>

            {/* Helper text */}
            <p className="text-xs text-[#595959]">
              Please include street address, if your inquiry relates to a
              specific store. You may use the &apos;Find a Store&apos; feature
              to locate the exact address to include in your comments.
            </p>
            <p className="text-xs text-[#595959]">
              <span className="text-[#DA291C]">*</span> indicates a required
              field
            </p>

            {/* Submit button */}
            <button
              type="button"
              className="inline-block bg-[#DA291C] px-10 py-3 text-sm font-bold uppercase text-white transition-colors hover:bg-[#b82217]"
            >
              Submit
            </button>
          </form>
        </div>
      </section>

      {/* ─── Contact by Mail or Phone ──────────────────────────── */}
      <section className="w-full bg-[#DA291C]">
        <div className="mx-auto max-w-[1200px] px-4 py-16">
          <h2
            className="mb-10 font-black text-white"
            style={{ fontSize: 40, lineHeight: 1.15 }}
          >
            Contact us by Mail or Phone
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {/* USA */}
            <div>
              <h3
                className="mb-4 font-semibold text-white"
                style={{ fontSize: 24 }}
              >
                If you are in the USA
              </h3>
              <div className="space-y-1 text-white" style={{ fontSize: 15, lineHeight: "24px" }}>
                <p>Corporate Office Circle K:</p>
                <p>1130 West Warner Road</p>
                <p>Tempe, Arizona 85284</p>
                <p className="mt-3 font-semibold">1-855-276-1947</p>
              </div>
            </div>

            {/* Canada */}
            <div>
              <h3
                className="mb-4 font-semibold text-white"
                style={{ fontSize: 24 }}
              >
                If you are in Canada
              </h3>
              <div className="space-y-1 text-white" style={{ fontSize: 15, lineHeight: "24px" }}>
                <p>Corporate Office Couche-Tard:</p>
                <p>4204, boul Industriel</p>
                <p>Laval, Quebec, Canada, H7L 0E3</p>
                <p className="mt-3 font-semibold">1-855-276-1947</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CircleKFooter />
    </div>
  );
}
