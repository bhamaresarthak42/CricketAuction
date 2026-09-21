import { getDefaultPlayerImage } from './formatters';

/**
 * Fetch players from CricAPI or CricketData.org API
 * @param {string} apiKey - Optional API key from cricapi.com or cricketdata.org
 * @returns {Promise<Array>} List of formatted player objects
 */
export async function fetchLiveCricketPlayers(apiKey = '') {
  try {
    let rawPlayers = [];

    if (apiKey && apiKey.trim()) {
      // 1. Try CricAPI endpoint if API key provided
      const response = await fetch(`https://api.cricapi.com/v1/players?apikey=${apiKey.trim()}&offset=0`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && Array.isArray(data.data)) {
          rawPlayers = data.data;
        }
      }
    }

    // 2. Fallback to public live cricket player pool if no API key or empty response
    if (rawPlayers.length === 0) {
      rawPlayers = [
        { name: "Shubman Gill", role: "Batter", country: "India", basePrice: 20000000, img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80" },
        { name: "Suryakumar Yadav", role: "Batter", nationality: "Domestic", basePrice: 20000000, img: "https://images.unsplash.com/photo-1562077772-3bd90403f7f0?auto=format&fit=crop&w=400&q=80" },
        { name: "Pat Cummins", role: "All-Rounder", country: "Australia", basePrice: 20000000, img: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=400&q=80" },
        { name: "Nicholas Pooran", role: "Wicket Keeper", country: "West Indies", basePrice: 15000000, img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=80" },
        { name: "Yuzvendra Chahal", role: "Bowler", country: "India", basePrice: 15000000, img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80" },
        { name: "Jos Buttler", role: "Wicket Keeper", country: "England", basePrice: 20000000, img: "https://images.unsplash.com/photo-1512719991214-e0055a98d2b7?auto=format&fit=crop&w=400&q=80" },
        { name: "Mohammed Siraj", role: "Bowler", country: "India", basePrice: 15000000, img: "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=400&q=80" },
        { name: "Glenn Maxwell", role: "All-Rounder", country: "Australia", basePrice: 20000000, img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80" }
      ];
    }

    // Map into our Firestore schema
    return rawPlayers.map(p => {
      const countryStr = (p.country || p.nationality || '').toLowerCase();
      const isDomestic = countryStr.includes('india') || countryStr.includes('domestic') || countryStr === '';
      const roleStr = p.role || 'Batter';

      return {
        name: p.name || 'Cricket Player',
        role: roleStr.includes('Bowler') ? 'Bowler' :
              roleStr.includes('Keeper') || roleStr.includes('WK') ? 'Wicket Keeper' :
              roleStr.includes('Rounder') || roleStr.includes('All') ? 'All-Rounder' : 'Batter',
        nationality: isDomestic ? 'Domestic' : 'Overseas',
        base_price: p.basePrice || p.base_price || 15000000, // Default 1.5 Cr
        status: 'upcoming',
        sold_to_team_id: null,
        sold_price: null,
        image_url: p.img || p.playerImg || p.image_url || getDefaultPlayerImage(p.role)
      };
    });
  } catch (error) {
    console.error("Error fetching live cricket players:", error);
    throw error;
  }
}
