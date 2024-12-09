export interface CryptoCurrency {
    symbol: string;
    price: string;
    percentageChange: string;
}

export interface CryptoState {
    cryptocurrencies: CryptoCurrency[];
    displayedCryptocurrencies: CryptoCurrency[];
    loading: boolean;
    error: string | null;
    sortBy: 'price' | 'percentage';
    selectedCryptos: string[];
}
