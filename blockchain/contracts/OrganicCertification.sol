// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OrganicCertification
 * @dev RythuJanaSethu Smart Contract for verifiable, tamper-proof Organic Certifications.
 */
contract OrganicCertification is ERC721, Ownable {
    uint256 public nextBatchId;

    // Mapping from Token ID (Batch ID) to its revocation status
    mapping(uint256 => bool) public isRevoked;
    
    // Mapping from Token ID to the farmer's wallet address
    mapping(uint256 => address) public farmerWallets;

    // Address authorized as the IoT Oracle (e.g., the Chainlink Node)
    address public iotOracleAddress;

    event CertificationMinted(uint256 indexed batchId, address indexed farmer);
    event CertificationRevoked(uint256 indexed batchId, string reason);

    constructor() ERC721("Rythu Organic Certification", "RYTHU-ORG") {
        nextBatchId = 1;
    }

    /**
     * @dev Sets the authorized IoT Oracle address that can trigger revocations
     */
    function setIotOracle(address _oracle) external onlyOwner {
        iotOracleAddress = _oracle;
    }

    /**
     * @dev Mints a new Organic Certification NFT for a specific crop batch.
     */
    function mintCertification(address _farmer) external onlyOwner returns (uint256) {
        uint256 batchId = nextBatchId++;
        _mint(_farmer, batchId);
        farmerWallets[batchId] = _farmer;
        
        emit CertificationMinted(batchId, _farmer);
        return batchId;
    }

    /**
     * @dev Revokes the organic certification. 
     * Can only be called by the automated IoT Oracle (e.g., when a massive nitrogen spike is detected in the soil).
     */
    function revokeCertification(uint256 _batchId, string memory _reason) external {
        require(msg.sender == iotOracleAddress || msg.sender == owner(), "Only Oracle or Admin can revoke");
        require(_exists(_batchId), "Certification does not exist");
        require(!isRevoked[_batchId], "Already revoked");

        isRevoked[_batchId] = true;
        
        // In a true zero-trust system, we could also burn the token
        // _burn(_batchId);

        emit CertificationRevoked(_batchId, _reason);
    }

    /**
     * @dev Check if a specific batch is verified organic
     */
    function checkStatus(uint256 _batchId) external view returns (string memory) {
        require(_exists(_batchId), "Batch not found on ledger");
        if (isRevoked[_batchId]) {
            return "REVOKED_FRAUD";
        }
        return "VERIFIED_ORGANIC";
    }
}
